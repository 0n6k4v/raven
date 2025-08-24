CREATE TABLE public.narcotics (
    id integer NOT NULL,
    exhibit_id integer,
    form_id integer,
    characteristics character varying(100),
    drug_type character varying(100),
    drug_category character varying(100),
    consumption_method character varying(100),
    effect text,
    weight_grams numeric(10,2)
);

CREATE TABLE public.narcotic_example_images (s
    id integer NOT NULL,
    narcotic_id integer,
    image_url text,
    description text,
    priority integer,
    image_type character varying(50)
);

CREATE TABLE public.narcotics_chemical_compounds (
    narcotic_id integer NOT NULL,
    chemical_compound_id integer NOT NULL,
    percentage numeric(5,2)
);

CREATE TABLE public.narcotics_image_vectors (
    id integer NOT NULL,
    narcotic_id integer,
    image_id integer,
    image_vector public.vector(16000)
);

CREATE TABLE public.narcotics_pills (
    narcotic_id integer NOT NULL,
    color character varying(50),
    diameter_mm numeric(5,2),
    thickness_mm numeric(5,2),
    edge_shape character varying(50)
);