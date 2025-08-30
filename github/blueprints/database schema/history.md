CREATE TABLE public.history (
    id integer NOT NULL,
    exhibit_id integer,
    subdistrict_id integer,
    discovery_date date,
    discovery_time time without time zone,
    discovered_by character varying(20),
    photo_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    modified_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    modified_by character varying(20),
    quantity numeric(10,2),
    location public.geometry(Point,4326) NOT NULL,
    ai_confidence numeric(5,2)
);