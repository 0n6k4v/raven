from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from sqlalchemy import select, func, desc
from sqlalchemy.orm import joinedload
from geoalchemy2 import WKTElement
import re

from app.models import history_model
from app.models.exhibit_model import Exhibit
from app.schemas.history_schema import HistoryCreate
from app.services.location_service import get_location_names
from app.services.user_service import get_discoverer_and_modifier_names
from app.config.cloudinary_config import upload_image_to_cloudinary

class HistoryController:
    def __init__(self):
        pass

    ALLOWED_FIELDS = {
        'subdistrict_id', 'discovery_date', 'discovery_time', 'ai_confidence',
        'place_name', 'house_number', 'village', 'soi', 'road',
        'quantity', 'exhibit_id', 'discovered_by', 'modified_by'
    }
    
    async def create_history(self, db: AsyncSession, history_data: HistoryCreate, image_file: Optional[object] = None) -> Dict[str, Any]:
        history_dict = history_data.model_dump(exclude_unset=True)

        latitude = history_dict.pop('latitude', None)
        longitude = history_dict.pop('longitude', None)

        if latitude is None or longitude is None:
            raise ValueError('Latitude and longitude are required')

        try:
            lat_f = float(latitude)
            lng_f = float(longitude)
        except (TypeError, ValueError):
            raise ValueError('Latitude and longitude must be numeric')

        if not (-90.0 <= lat_f <= 90.0 and -180.0 <= lng_f <= 180.0):
            raise ValueError('Latitude or longitude out of range')

        discovered_by = history_dict.get('discovered_by') or 'system'
        history_dict['discovered_by'] = discovered_by

        if 'ai_confidence' in history_dict:
            try:
                history_dict['ai_confidence'] = float(history_dict.get('ai_confidence'))
            except (TypeError, ValueError):
                history_dict.pop('ai_confidence', None)

        history_kwargs: Dict[str, Any] = {k: history_dict[k] for k in self.ALLOWED_FIELDS if k in history_dict}

        history_kwargs['location'] = WKTElement(f'POINT({lng_f} {lat_f})', srid=4326)

        try:
            async with db.begin():
                db_history = history_model.History(**history_kwargs)
                db.add(db_history)
                await db.flush()
                history_id = getattr(db_history, 'id', None)

            # upload image after commit to avoid orphaned uploads; update record if upload succeeds
            if image_file:
                try:
                    upload_result = await upload_image_to_cloudinary(image_file, 'evidence_history')
                    photo_url = None
                    if isinstance(upload_result, dict):
                        photo_url = upload_result.get('secure_url') or upload_result.get('url')
                    else:
                        photo_url = str(upload_result)

                    if photo_url:
                        async with db.begin():
                            await db.refresh(db_history)
                            db_history.photo_url = photo_url
                            db.add(db_history)
                except Exception:
                    # If upload fails, do not fail the whole operation by default
                    pass

            return await self.get_history_by_id(db, history_id)

        except Exception:
            # Let the caller handle/report exceptions; ensure rollback by context manager
            raise

    async def get_all_histories(self, db: AsyncSession, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        stmt = select(history_model.History, func.ST_AsText(history_model.History.location).label('location_wkt')).options(
            joinedload(history_model.History.exhibit).joinedload(Exhibit.narcotics),
            joinedload(history_model.History.exhibit).joinedload(Exhibit.firearms)
        )

        if user_id is not None:
            stmt = stmt.where(history_model.History.discovered_by == str(user_id))

        stmt = stmt.order_by(desc(history_model.History.created_at))

        result = await db.execute(stmt)
        histories = result.unique().all()

        enhanced_histories = []
        for history, location_wkt in histories:
            history_dict = {c.name: getattr(history, c.name) for c in history.__table__.columns}

            if 'location' in history_dict:
                del history_dict['location']

            if location_wkt:
                wkt_match = re.search(r'POINT\(\s*([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)\s*\)', location_wkt)
                if wkt_match:
                    history_dict['longitude'] = float(wkt_match.group(1))
                    history_dict['latitude'] = float(wkt_match.group(2))

            if history_dict.get('discovery_date'):
                history_dict['discovery_date'] = history_dict['discovery_date'].isoformat()
            if history_dict.get('discovery_time'):
                time_obj = history_dict['discovery_time']
                history_dict['discovery_time'] = f"{time_obj.hour:02d}:{time_obj.minute:02d}"
            if history_dict.get('created_at'):
                history_dict['created_at'] = history_dict['created_at'].isoformat()
            if history_dict.get('modified_at'):
                history_dict['modified_at'] = history_dict['modified_at'].isoformat()

            if history_dict.get('ai_confidence') is not None:
                history_dict['ai_confidence'] = float(history_dict['ai_confidence'])

            if history.exhibit:
                exhibit_dict = {c.name: getattr(history.exhibit, c.name) for c in history.exhibit.__table__.columns}

                # Narcotics
                if getattr(history.exhibit, 'narcotics', None):
                    narcotics_list = []
                    for narc in (history.exhibit.narcotics if hasattr(history.exhibit.narcotics, '__iter__') else [history.exhibit.narcotics]):
                        if hasattr(narc, '__table__'):
                            narcotic_dict = {c.name: getattr(narc, c.name) for c in narc.__table__.columns}
                            narcotics_list.append(narcotic_dict)
                    exhibit_dict['narcotics'] = narcotics_list

                # Firearms
                if getattr(history.exhibit, 'firearms', None):
                    firearms_list = []
                    for firearm in (history.exhibit.firearms if hasattr(history.exhibit.firearms, '__iter__') else [history.exhibit.firearms]):
                        if hasattr(firearm, '__table__'):
                            firearm_dict = {c.name: getattr(firearm, c.name) for c in firearm.__table__.columns}
                            firearms_list.append(firearm_dict)
                    exhibit_dict['firearms'] = firearms_list

                history_dict['exhibit'] = exhibit_dict

            location_names = await get_location_names(db, history.subdistrict_id)

            user_names = await get_discoverer_and_modifier_names(db, history.discovered_by, history.modified_by)

            history_dict.update(location_names)
            history_dict.update(user_names)

            enhanced_histories.append(history_dict)

        return enhanced_histories

    async def get_history_by_id(self, db: AsyncSession, history_id: int) -> Optional[Dict[str, Any]]:
        stmt = select(history_model.History, func.ST_AsText(history_model.History.location).label('location_wkt')).options(
            joinedload(history_model.History.exhibit).joinedload(Exhibit.narcotics)
        ).where(history_model.History.id == history_id)

        result = await db.execute(stmt)
        history_with_location = result.unique().first()

        if not history_with_location:
            return None

        history, location_wkt = history_with_location

        history_dict = {c.name: getattr(history, c.name) for c in history.__table__.columns}

        if 'location' in history_dict:
            del history_dict['location']

        if location_wkt:
            wkt_match = re.search(r'POINT\(\s*([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)\s*\)', location_wkt)
            if wkt_match:
                history_dict['longitude'] = float(wkt_match.group(1))
                history_dict['latitude'] = float(wkt_match.group(2))

        if history_dict.get('discovery_date'):
            history_dict['discovery_date'] = history_dict['discovery_date'].isoformat()
        if history_dict.get('discovery_time'):
            time_obj = history_dict['discovery_time']
            history_dict['discovery_time'] = f"{time_obj.hour:02d}:{time_obj.minute:02d}"
        if history_dict.get('created_at'):
            history_dict['created_at'] = history_dict['created_at'].isoformat()
        if history_dict.get('modified_at'):
            history_dict['modified_at'] = history_dict['modified_at'].isoformat()

        if history_dict.get('ai_confidence') is not None:
            history_dict['ai_confidence'] = float(history_dict['ai_confidence'])

        if history.exhibit:
            exhibit_dict = {c.name: getattr(history.exhibit, c.name) for c in history.exhibit.__table__.columns}

            if getattr(history.exhibit, 'narcotics', None):
                narcotics_list = []
                for narc in (history.exhibit.narcotics if hasattr(history.exhibit.narcotics, '__iter__') else [history.exhibit.narcotics]):
                    if hasattr(narc, '__table__'):
                        narcotic_dict = {c.name: getattr(narc, c.name) for c in narc.__table__.columns}
                        narcotics_list.append(narcotic_dict)
                exhibit_dict['narcotics'] = narcotics_list

            history_dict['exhibit'] = exhibit_dict

        location_names = await get_location_names(db, history.subdistrict_id)

        user_names = await get_discoverer_and_modifier_names(db, history.discovered_by, history.modified_by)

        history_dict.update(location_names)
        history_dict.update(user_names)

        return history_dict

    async def get_narcotic_histories(self, db: AsyncSession) -> List[Dict[str, Any]]:
        stmt = select(history_model.History, func.ST_AsText(history_model.History.location).label('location_wkt')).options(
            joinedload(history_model.History.exhibit).joinedload(Exhibit.narcotics)
        ).where(history_model.History.exhibit.has(Exhibit.category == "ยาเสพติด"))

        stmt = stmt.order_by(desc(history_model.History.created_at))

        result = await db.execute(stmt)
        histories = result.unique().all()

        enhanced_histories = []
        for history, location_wkt in histories:
            history_dict = {c.name: getattr(history, c.name) for c in history.__table__.columns}

            if 'location' in history_dict:
                del history_dict['location']

            if location_wkt:
                wkt_match = re.search(r'POINT\(\s*([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)\s*\)', location_wkt)
                if wkt_match:
                    history_dict['longitude'] = float(wkt_match.group(1))
                    history_dict['latitude'] = float(wkt_match.group(2))

            if history_dict.get('discovery_date'):
                history_dict['discovery_date'] = history_dict['discovery_date'].isoformat()
            if history_dict.get('discovery_time'):
                time_obj = history_dict['discovery_time']
                history_dict['discovery_time'] = f"{time_obj.hour:02d}:{time_obj.minute:02d}"
            if history_dict.get('created_at'):
                history_dict['created_at'] = history_dict['created_at'].isoformat()
            if history_dict.get('modified_at'):
                history_dict['modified_at'] = history_dict['modified_at'].isoformat()

            if history_dict.get('ai_confidence') is not None:
                history_dict['ai_confidence'] = float(history_dict['ai_confidence'])

            exhibit_dict = None
            if history.exhibit:
                exhibit_dict = {
                    'id': history.exhibit.id,
                    'category': history.exhibit.category,
                    'subcategory': history.exhibit.subcategory,
                }

                narcotic_data = getattr(history.exhibit, 'narcotics', None) or None
                if narcotic_data:
                    narc = narcotic_data[0] if hasattr(narcotic_data, '__iter__') and len(narcotic_data) > 0 else narcotic_data
                    if narc and hasattr(narc, '__table__'):
                        narc_dict = {c.name: getattr(narc, c.name) for c in narc.__table__.columns}
                        if narc_dict.get('weight_grams') is not None:
                            try:
                                narc_dict['weight_grams'] = float(narc_dict['weight_grams'])
                            except Exception:
                                pass
                        exhibit_dict['narcotics'] = [narc_dict]

                history_dict['exhibit'] = exhibit_dict

            location_names = await get_location_names(db, history.subdistrict_id)
            user_names = await get_discoverer_and_modifier_names(db, history.discovered_by, history.modified_by)

            history_dict.update(location_names)
            history_dict.update(user_names)

            enhanced_histories.append(history_dict)

        return enhanced_histories

    async def delete_history(self, db: AsyncSession, history_id: int) -> bool:
        stmt = select(history_model.History).where(history_model.History.id == history_id)
        result = await db.execute(stmt)
        history = result.scalars().first()

        if not history:
            return False

        await db.delete(history)
        await db.commit()
        return True

    async def _serialize_history_row(self, history_obj, location_wkt) -> Dict[str, Any]:
        history_dict = {c.name: getattr(history_obj, c.name) for c in history_obj.__table__.columns}

        history_dict.pop('location', None)

        if location_wkt:
            m = re.search(r'POINT\(\s*([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)\s*\)', location_wkt)
            if m:
                history_dict['longitude'] = float(m.group(1))
                history_dict['latitude'] = float(m.group(2))

        if history_dict.get('discovery_date'):
            try:
                history_dict['discovery_date'] = history_dict['discovery_date'].isoformat()
            except Exception:
                pass
        if history_dict.get('discovery_time'):
            t = history_dict['discovery_time']
            history_dict['discovery_time'] = f"{t.hour:02d}:{t.minute:02d}"
        if history_dict.get('created_at'):
            history_dict['created_at'] = history_dict['created_at'].isoformat()
        if history_dict.get('modified_at'):
            history_dict['modified_at'] = history_dict['modified_at'].isoformat()

        if history_dict.get('ai_confidence') is not None:
            try:
                history_dict['ai_confidence'] = float(history_dict['ai_confidence'])
            except Exception:
                pass

        if history_obj.exhibit:
            exhibit_dict = {c.name: getattr(history_obj.exhibit, c.name) for c in history_obj.exhibit.__table__.columns}

            # narcotics
            if getattr(history_obj.exhibit, 'narcotics', None):
                narcotics_list = []
                for narc in (history_obj.exhibit.narcotics if hasattr(history_obj.exhibit.narcotics, '__iter__') else [history_obj.exhibit.narcotics]):
                    if hasattr(narc, '__table__'):
                        narcotics_list.append({c.name: getattr(narc, c.name) for c in narc.__table__.columns})
                exhibit_dict['narcotics'] = narcotics_list

            # firearms
            if getattr(history_obj.exhibit, 'firearms', None):
                firearms_list = []
                for fa in (history_obj.exhibit.firearms if hasattr(history_obj.exhibit.firearms, '__iter__') else [history_obj.exhibit.firearms]):
                    if hasattr(fa, '__table__'):
                        firearms_list.append({c.name: getattr(fa, c.name) for c in fa.__table__.columns})
                exhibit_dict['firearms'] = firearms_list

            history_dict['exhibit'] = exhibit_dict

        return history_dict

    async def get_histories_by_exhibit_and_user(
        self,
        db: AsyncSession,
        exhibit_id: int,
        user_id: Optional[str] = None,
        requesting_user: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        # 1) ensure exhibit exists and read its category
        stmt_ex = select(Exhibit).where(Exhibit.id == exhibit_id)
        res_ex = await db.execute(stmt_ex)
        exhibit_obj = res_ex.scalars().first()
        if not exhibit_obj:
            # no such exhibit => no histories
            return []

        exhibit_category = getattr(exhibit_obj, 'category', None)

        # 2) determine effective discovered_by filter
        def _get_user_identifier(user):
            if not user:
                return None
            return getattr(user, 'user_id', None) or getattr(user, 'id', None) or None

        effective_user_filter: Optional[str] = None
        if user_id:
            effective_user_filter = str(user_id)
        else:
            requesting_user_id = _get_user_identifier(requesting_user)
            role = getattr(requesting_user, 'role', None)
            role_id = getattr(role, 'id', None) if role else None
            department = getattr(requesting_user, 'department', None)

            # admin -> no user filter
            if role_id == 1:
                effective_user_filter = None
            # departmental user -> allow all if department matches exhibit category, else restrict to own
            elif role_id == 2:
                allows_all = False
                if department == "กลุ่มงานอาวุธปืน" and exhibit_category in ("ปืน", "อาวุธปืน"):
                    allows_all = True
                if department == "กลุ่มงานยาเสพติด" and exhibit_category == "ยาเสพติด":
                    allows_all = True
                effective_user_filter = None if allows_all else (str(requesting_user_id) if requesting_user_id else None)
            # default: restrict to own
            else:
                effective_user_filter = str(requesting_user_id) if requesting_user_id else None

        # 3) build query
        stmt = (
            select(history_model.History, func.ST_AsText(history_model.History.location).label('location_wkt'))
            .options(
                joinedload(history_model.History.exhibit).joinedload(Exhibit.narcotics),
                joinedload(history_model.History.exhibit).joinedload(Exhibit.firearms)
            )
            .where(history_model.History.exhibit_id == exhibit_id)
            .order_by(desc(history_model.History.created_at))
        )

        if effective_user_filter:
            stmt = stmt.where(history_model.History.discovered_by == effective_user_filter)

        # 4) execute and map
        result = await db.execute(stmt)
        rows = result.unique().all()
        if not rows:
            return []

        mapped = []
        for history_obj, location_wkt in rows:
            row_dict = await self._serialize_history_row(history_obj, location_wkt)
            # enrich with location names and discoverer/modifier names if needed (reuse existing services)
            try:
                location_names = await get_location_names(db, history_obj.subdistrict_id)
                user_names = await get_discoverer_and_modifier_names(db, history_obj.discovered_by, history_obj.modified_by)
                row_dict.update(location_names or {})
                row_dict.update(user_names or {})
            except Exception:
                # fail-safe: continue without enrichment
                pass
            mapped.append(row_dict)

        return mapped

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

