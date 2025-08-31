CREATE TABLE public.firearms (
    id integer NOT NULL,
    exhibit_id integer,
    mechanism character varying(100),
    brand character varying(100),
    series character varying(100),
    model character varying(100),
    normalized_name character varying(255)
);