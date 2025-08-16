CREATE TABLE public.provinces (
    id integer NOT NULL,
    province_name text NOT NULL,
    reg_nesdb text,
    reg_royin text,
    perimeter double precision,
    area_sqkm double precision,
    geom public.geometry(MultiPolygon,4326)
);

CREATE TABLE public.districts (
    id integer NOT NULL,
    province_id integer,
    district_name text NOT NULL,
    perimeter double precision,
    area_sqkm double precision,
    geom public.geometry(MultiPolygon,4326)
);

CREATE TABLE public.subdistricts (
    id integer NOT NULL,
    district_id integer,
    subdistrict_name text NOT NULL,
    perimeter double precision,
    area_sqkm double precision,
    geom public.geometry(MultiPolygon,4326)
);