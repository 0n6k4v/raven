CREATE TABLE public.firearms (
    id integer NOT NULL,
    exhibit_id integer,
    mechanism character varying(100),
    brand character varying(100),
    series character varying(100),
    model character varying(100),
    normalized_name character varying(255)
);

CREATE TABLE public.ammunitions (
    id integer NOT NULL,
    caliber character varying(50) NOT NULL,
    type character varying(100),
    description text
);

CREATE TABLE public.firearm_ammunitions (
    firearm_id integer NOT NULL,
    ammunition_id integer NOT NULL
);

CREATE TABLE public.firearms_example_images (
    id integer NOT NULL,
    firearm_id integer,
    image_url text,
    description text,
    priority integer
);