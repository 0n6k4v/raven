from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from sqlalchemy import select, func, desc
from sqlalchemy.orm import joinedload
import re

from app.models import history_model
from app.models.exhibit_model import Exhibit
from app.services.location_service import get_location_names
from app.services.user_service import get_discoverer_and_modifier_names

class HistoryController:
    def __init__(self):
        pass

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