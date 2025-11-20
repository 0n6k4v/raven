from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy import select, func, desc, delete
from sqlalchemy.orm import joinedload
from geoalchemy2 import WKTElement
from geoalchemy2.functions import ST_AsText
import re
from decimal import Decimal
import logging

from app.models import history_model
from app.models.exhibit_model import Exhibit
from app.schemas.history_schema import HistoryCreate
from app.services.location_service import get_location_names
from app.services.user_service import get_discoverer_and_modifier_names
from app.config.cloudinary_config import upload_image_to_cloudinary

logger = logging.getLogger(__name__)

WKT_POINT_PATTERN = re.compile(
    r'POINT\(\s*([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)\s*\)'
)


class HistoryController:
    ALLOWED_FIELDS = frozenset({
        'subdistrict_id', 'discovery_date', 'discovery_time', 'ai_confidence',
        'place_name', 'house_number', 'village', 'soi', 'road',
        'quantity', 'exhibit_id', 'discovered_by', 'modified_by'
    })
    
    MIN_LATITUDE = -90.0
    MAX_LATITUDE = 90.0
    MIN_LONGITUDE = -180.0
    MAX_LONGITUDE = 180.0
    DEFAULT_SRID = 4326
    
    def __init__(self):
        """Initialize the controller."""
        pass

    @staticmethod
    def _validate_coordinates(latitude: Any, longitude: Any) -> Tuple[float, float]:
        if latitude is None or longitude is None:
            raise ValueError('Latitude and longitude are required')

        try:
            lat_f = float(latitude)
            lng_f = float(longitude)
        except (TypeError, ValueError) as e:
            raise ValueError(f'Latitude and longitude must be numeric: {e}')

        if not (HistoryController.MIN_LATITUDE <= lat_f <= HistoryController.MAX_LATITUDE):
            raise ValueError(f'Latitude must be between {HistoryController.MIN_LATITUDE} and {HistoryController.MAX_LATITUDE}')
        
        if not (HistoryController.MIN_LONGITUDE <= lng_f <= HistoryController.MAX_LONGITUDE):
            raise ValueError(f'Longitude must be between {HistoryController.MIN_LONGITUDE} and {HistoryController.MAX_LONGITUDE}')

        return lat_f, lng_f

    @staticmethod
    def _create_point_geometry(longitude: float, latitude: float) -> WKTElement:
        return WKTElement(
            f'POINT({longitude} {latitude})', 
            srid=HistoryController.DEFAULT_SRID
        )

    @staticmethod
    def _parse_wkt_point(wkt_string: str) -> Optional[Tuple[float, float]]:
        if not wkt_string:
            return None
        
        match = WKT_POINT_PATTERN.search(wkt_string)
        if match:
            try:
                return float(match.group(1)), float(match.group(2))
            except (ValueError, IndexError):
                logger.warning(f"Failed to parse WKT coordinates from: {wkt_string}")
                return None
        return None

    @staticmethod
    def _serialize_datetime_fields(data: Dict[str, Any]) -> None:
        if data.get('discovery_date'):
            data['discovery_date'] = data['discovery_date'].isoformat()
        
        if data.get('discovery_time'):
            time_obj = data['discovery_time']
            data['discovery_time'] = f"{time_obj.hour:02d}:{time_obj.minute:02d}"
        
        if data.get('created_at'):
            data['created_at'] = data['created_at'].isoformat()
        
        if data.get('modified_at'):
            data['modified_at'] = data['modified_at'].isoformat()

    @staticmethod
    def _convert_to_float(value: Any) -> Optional[float]:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    async def create_history(
        self, 
        db: AsyncSession, 
        history_data: HistoryCreate, 
        image_file: Optional[object] = None
    ) -> Dict[str, Any]:
        history_dict = history_data.model_dump(exclude_unset=True)

        latitude = history_dict.pop('latitude', None)
        longitude = history_dict.pop('longitude', None)
        lat_f, lng_f = self._validate_coordinates(latitude, longitude)

        if not history_dict.get('discovered_by'):
            history_dict['discovered_by'] = 'system'

        if 'ai_confidence' in history_dict:
            history_dict['ai_confidence'] = self._convert_to_float(
                history_dict['ai_confidence']
            )

        history_kwargs = {
            k: history_dict[k] 
            for k in self.ALLOWED_FIELDS 
            if k in history_dict
        }

        history_kwargs['location'] = self._create_point_geometry(lng_f, lat_f)

        try:
            db_history = history_model.History(**history_kwargs)
            db.add(db_history)
            await db.flush()

            history_id = db_history.id

            if image_file:
                try:
                    upload_result = await upload_image_to_cloudinary(
                        image_file, 
                        'evidence_history'
                    )
                    logger.debug("[history_controller] upload_result: public_id=%s secure_url=%s", upload_result.get('public_id') if isinstance(upload_result, dict) else None, upload_result.get('secure_url') if isinstance(upload_result, dict) else upload_result)
                    photo_url = None
                    if isinstance(upload_result, dict):
                        photo_url = upload_result.get('secure_url') or upload_result.get('url')
                    else:
                        photo_url = str(upload_result)

                    if photo_url:
                        await db.refresh(db_history)
                        db_history.photo_url = photo_url
                        db.add(db_history)
                        
                except Exception as e:
                    logger.error(f"Failed to upload image: {e}", exc_info=True)

            await db.commit()
            
            await db.refresh(db_history)
            
            created = await self.get_history_by_id(db, history_id)
            
            if not created:
                raise RuntimeError('Failed to persist history record')

            return created

        except Exception as e:
            logger.error(f"Failed to create history: {e}", exc_info=True)
            await db.rollback()
            raise

    async def get_all_histories(
        self, 
        db: AsyncSession, 
        user_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        stmt = (
            select(
                history_model.History,
                func.ST_AsText(history_model.History.location).label('location_wkt')
            )
            .options(
                joinedload(history_model.History.exhibit).joinedload(Exhibit.narcotics),
                joinedload(history_model.History.exhibit).joinedload(Exhibit.firearms)
            )
            .order_by(desc(history_model.History.created_at))
        )

        if user_id is not None:
            stmt = stmt.where(history_model.History.discovered_by == str(user_id))

        result = await db.execute(stmt)
        histories = result.unique().all()

        enhanced_histories = []
        for history, location_wkt in histories:
            history_dict = await self._serialize_history_row(history, location_wkt)
            
            try:
                location_names = await get_location_names(db, history.subdistrict_id)
                user_names = await get_discoverer_and_modifier_names(
                    db, history.discovered_by, history.modified_by
                )
                history_dict.update(location_names or {})
                history_dict.update(user_names or {})
            except Exception as e:
                logger.warning(f"Failed to enrich history {history.id}: {e}")

            enhanced_histories.append(history_dict)

        return enhanced_histories

    async def get_narcotic_histories(self, db: AsyncSession) -> List[Dict[str, Any]]:
        stmt = (
            select(
                history_model.History,
                func.ST_AsText(history_model.History.location).label('location_wkt')
            )
            .options(
                joinedload(history_model.History.exhibit).joinedload(Exhibit.narcotics)
            )
            .where(history_model.History.exhibit.has(Exhibit.category == "ยาเสพติด"))
            .order_by(desc(history_model.History.created_at))
        )

        result = await db.execute(stmt)
        histories = result.unique().all()

        enhanced_histories = []
        for history, location_wkt in histories:
            history_dict = {
                c.name: getattr(history, c.name) 
                for c in history.__table__.columns
            }
            history_dict.pop('location', None)

            coords = self._parse_wkt_point(location_wkt)
            if coords:
                history_dict['longitude'], history_dict['latitude'] = coords

            self._serialize_datetime_fields(history_dict)

            if history_dict.get('ai_confidence') is not None:
                history_dict['ai_confidence'] = self._convert_to_float(
                    history_dict['ai_confidence']
                )

            if history.exhibit:
                exhibit_dict = {
                    'id': history.exhibit.id,
                    'category': history.exhibit.category,
                    'subcategory': history.exhibit.subcategory,
                }

                narcotic_data = getattr(history.exhibit, 'narcotics', None)
                if narcotic_data:
                    narc_list = narcotic_data if hasattr(narcotic_data, '__iter__') else [narcotic_data]
                    if narc_list:
                        narc = narc_list[0]
                        if hasattr(narc, '__table__'):
                            narc_dict = {
                                c.name: getattr(narc, c.name) 
                                for c in narc.__table__.columns
                            }
                            if narc_dict.get('weight_grams') is not None:
                                narc_dict['weight_grams'] = self._convert_to_float(
                                    narc_dict['weight_grams']
                                )
                            exhibit_dict['narcotics'] = [narc_dict]

                history_dict['exhibit'] = exhibit_dict

            try:
                location_names = await get_location_names(db, history.subdistrict_id)
                user_names = await get_discoverer_and_modifier_names(
                    db, history.discovered_by, history.modified_by
                )
                history_dict.update(location_names or {})
                history_dict.update(user_names or {})
            except Exception as e:
                logger.warning(f"Failed to enrich narcotic history {history.id}: {e}")

            enhanced_histories.append(history_dict)

        return enhanced_histories

    async def delete_history(self, db: AsyncSession, history_id: int) -> bool:
        stmt = delete(history_model.History).where(
            history_model.History.id == history_id
        )
        result = await db.execute(stmt)
        await db.commit()
        
        return result.rowcount > 0

    async def _serialize_history_row(
        self, 
        history_obj: history_model.History, 
        location_wkt: Optional[str]
    ) -> Dict[str, Any]:
        history_dict = {
            c.name: getattr(history_obj, c.name) 
            for c in history_obj.__table__.columns
        }
        
        history_dict.pop('location', None)

        coords = self._parse_wkt_point(location_wkt)
        if coords:
            history_dict['longitude'], history_dict['latitude'] = coords

        self._serialize_datetime_fields(history_dict)

        if history_dict.get('ai_confidence') is not None:
            history_dict['ai_confidence'] = self._convert_to_float(
                history_dict['ai_confidence']
            )

        if history_obj.exhibit:
            exhibit_dict = {
                c.name: getattr(history_obj.exhibit, c.name) 
                for c in history_obj.exhibit.__table__.columns
            }

            if getattr(history_obj.exhibit, 'narcotics', None):
                narcotics_list = []
                narc_relation = history_obj.exhibit.narcotics
                narc_items = narc_relation if hasattr(narc_relation, '__iter__') else [narc_relation]
                
                for narc in narc_items:
                    if hasattr(narc, '__table__'):
                        narc_dict = {
                            c.name: getattr(narc, c.name) 
                            for c in narc.__table__.columns
                        }
                        narcotics_list.append(narc_dict)
                
                if narcotics_list:
                    exhibit_dict['narcotics'] = narcotics_list

            if getattr(history_obj.exhibit, 'firearms', None):
                firearms_list = []
                firearm_relation = history_obj.exhibit.firearms
                firearm_items = firearm_relation if hasattr(firearm_relation, '__iter__') else [firearm_relation]
                
                for firearm in firearm_items:
                    if hasattr(firearm, '__table__'):
                        firearm_dict = {
                            c.name: getattr(firearm, c.name) 
                            for c in firearm.__table__.columns
                        }
                        firearms_list.append(firearm_dict)
                
                if firearms_list:
                    exhibit_dict['firearms'] = firearms_list

            history_dict['exhibit'] = exhibit_dict

        return history_dict

    async def get_history_by_id(
        self, 
        db: AsyncSession, 
        history_id: int
    ) -> Optional[Dict[str, Any]]:
        stmt = (
            select(
                history_model.History,
                func.ST_AsText(history_model.History.location).label('location_wkt')
            )
            .options(
                joinedload(history_model.History.exhibit).joinedload(Exhibit.narcotics),
                joinedload(history_model.History.exhibit).joinedload(Exhibit.firearms)
            )
            .where(history_model.History.id == history_id)
        )

        result = await db.execute(stmt)
        row = result.unique().first()
        
        if not row:
            return None

        history_obj, location_wkt = row

        try:
            history_dict = await self._serialize_history_row(history_obj, location_wkt)

            try:
                location_names = await get_location_names(db, history_obj.subdistrict_id)
                user_names = await get_discoverer_and_modifier_names(
                    db, history_obj.discovered_by, history_obj.modified_by
                )
                if location_names:
                    history_dict.update(location_names)
                if user_names:
                    history_dict.update(user_names)
            except Exception as e:
                logger.warning(f"Failed to enrich history {history_id}: {e}")

            return history_dict
            
        except Exception as e:
            logger.error(f"Failed to serialize history {history_id}: {e}", exc_info=True)
            return None

    async def get_histories_by_exhibit_and_user(
        self,
        db: AsyncSession,
        exhibit_id: int,
        user_id: Optional[str] = None,
        requesting_user: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        stmt_ex = select(Exhibit).where(Exhibit.id == exhibit_id)
        res_ex = await db.execute(stmt_ex)
        exhibit_obj = res_ex.scalars().first()
        
        if not exhibit_obj:
            return []

        exhibit_category = getattr(exhibit_obj, 'category', None)

        effective_user_filter = self._determine_user_filter(
            user_id, 
            requesting_user, 
            exhibit_category
        )

        stmt = (
            select(
                history_model.History,
                func.ST_AsText(history_model.History.location).label('location_wkt')
            )
            .options(
                joinedload(history_model.History.exhibit).joinedload(Exhibit.narcotics),
                joinedload(history_model.History.exhibit).joinedload(Exhibit.firearms)
            )
            .where(history_model.History.exhibit_id == exhibit_id)
            .order_by(desc(history_model.History.created_at))
        )

        if effective_user_filter:
            stmt = stmt.where(
                history_model.History.discovered_by == effective_user_filter
            )

        result = await db.execute(stmt)
        rows = result.unique().all()
        
        if not rows:
            return []

        mapped = []
        for history_obj, location_wkt in rows:
            row_dict = await self._serialize_history_row(history_obj, location_wkt)
            
            try:
                location_names = await get_location_names(db, history_obj.subdistrict_id)
                user_names = await get_discoverer_and_modifier_names(
                    db, history_obj.discovered_by, history_obj.modified_by
                )
                row_dict.update(location_names or {})
                row_dict.update(user_names or {})
            except Exception as e:
                logger.warning(f"Failed to enrich history {history_obj.id}: {e}")

            mapped.append(row_dict)

        return mapped

    def _determine_user_filter(
        self,
        user_id: Optional[str],
        requesting_user: Optional[Dict[str, Any]],
        exhibit_category: Optional[str]
    ) -> Optional[str]:
        if user_id:
            return str(user_id)
        
        if not requesting_user:
            return None

        requesting_user_id = (
            getattr(requesting_user, 'user_id', None) or 
            getattr(requesting_user, 'id', None)
        )
        role = getattr(requesting_user, 'role', None)
        role_id = getattr(role, 'id', None) if role else None
        department = getattr(requesting_user, 'department', None)

        if role_id == 1:
            return None

        if role_id == 2:
            if department == "กลุ่มงานอาวุธปืน" and exhibit_category in ("ปืน", "อาวุธปืน"):
                return None
            if department == "กลุ่มงานยาเสพติด" and exhibit_category == "ยาเสพติด":
                return None

        return str(requesting_user_id) if requesting_user_id else None

    async def get_histories_by_exhibit(
        self,
        db: AsyncSession,
        exhibit_id: int,
        requesting_user: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        return await self.get_histories_by_exhibit_and_user(
            db=db,
            exhibit_id=exhibit_id,
            user_id=None,
            requesting_user=requesting_user
        )