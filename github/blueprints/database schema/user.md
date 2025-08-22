CREATE TABLE public.users (
    id integer NOT NULL,
    user_id character varying(20) NOT NULL,
    title character varying(20),
    firstname character varying(100) NOT NULL,
    lastname character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password text NOT NULL,
    profile_image_url text,
    role_id integer NOT NULL,
    department character varying(100),
    is_active boolean DEFAULT true NOT NULL,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


CREATE TABLE public.user_permissions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    permission_type character varying(50) NOT NULL,
    granted boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
