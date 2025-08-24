from app.models.base import Base
from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, Numeric, PrimaryKeyConstraint, Index
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from pgvector.sqlalchemy import Vector
from app.models.exhibit_model import Exhibit

class ChemicalCompound(Base):
    __tablename__ = "chemical_compounds"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (Index("ix_chemical_compounds_id", "id"),)

class DrugForm(Base):
    __tablename__ = "drug_forms"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    narcotics: Mapped[list["Narcotic"]] = relationship(
        back_populates="drug_form", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_drug_forms_id", "id"),)

class Narcotic(Base):
    __tablename__ = "narcotics"

    id: Mapped[int] = mapped_column(primary_key=True)
    exhibit_id: Mapped[int | None] = mapped_column(ForeignKey("exhibits.id"))
    form_id: Mapped[int | None] = mapped_column(ForeignKey("drug_forms.id"))
    characteristics: Mapped[str | None] = mapped_column(String(100))
    drug_type: Mapped[str | None] = mapped_column(String(100))
    drug_category: Mapped[str | None] = mapped_column(String(100))
    consumption_method: Mapped[str | None] = mapped_column(String(100))
    effect: Mapped[str | None] = mapped_column(Text)
    weight_grams: Mapped[float | None] = mapped_column(Numeric(10, 2))

    exhibit = relationship("Exhibit", back_populates="narcotics")
    drug_form = relationship("DrugForm", back_populates="narcotics")
    example_images = relationship(
        "NarcoticExampleImage", back_populates="narcotic", cascade="all, delete-orphan"
    )
    chemical_compounds = relationship(
        "NarcoticChemicalCompound", back_populates="narcotic", cascade="all, delete-orphan"
    )
    image_vectors = relationship(
        "NarcoticImageVector", back_populates="narcotic", cascade="all, delete-orphan"
    )
    pill_info = relationship(
        "NarcoticPill", uselist=False, back_populates="narcotic", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_narcotics_id", "id"),)

class NarcoticExampleImage(Base):
    __tablename__ = "narcotic_example_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    narcotic_id: Mapped[int] = mapped_column(
        ForeignKey("narcotics.id", ondelete="CASCADE"), nullable=False
    )
    image_url: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    priority: Mapped[int | None] = mapped_column(Integer)
    image_type: Mapped[str | None] = mapped_column(String(50))

    narcotic = relationship("Narcotic", back_populates="example_images")
    image_vectors = relationship("NarcoticImageVector", back_populates="image")

    __table_args__ = (Index("ix_narcotic_example_images_id", "id"),)

class NarcoticChemicalCompound(Base):
    __tablename__ = "narcotics_chemical_compounds"

    narcotic_id: Mapped[int] = mapped_column(
        ForeignKey("narcotics.id", ondelete="CASCADE"), primary_key=True
    )
    chemical_compound_id: Mapped[int] = mapped_column(
        ForeignKey("chemical_compounds.id"), primary_key=True
    )
    percentage: Mapped[float | None] = mapped_column(Numeric(5, 2))

    narcotic = relationship("Narcotic", back_populates="chemical_compounds")
    chemical_compound = relationship("ChemicalCompound")

    __table_args__ = (
        PrimaryKeyConstraint("narcotic_id", "chemical_compound_id"),
    )

class NarcoticImageVector(Base):
    __tablename__ = "narcotics_image_vectors"

    id: Mapped[int] = mapped_column(primary_key=True)
    narcotic_id: Mapped[int] = mapped_column(
        ForeignKey("narcotics.id", ondelete="CASCADE"), nullable=False
    )
    image_id: Mapped[int] = mapped_column(
        ForeignKey("narcotic_example_images.id", ondelete="CASCADE"), nullable=False
    )
    image_vector: Mapped[bytes | None] = mapped_column(Vector(16000))

    narcotic = relationship("Narcotic", back_populates="image_vectors")
    image = relationship("NarcoticExampleImage", back_populates="image_vectors")

    __table_args__ = (Index("ix_narcotics_image_vectors_id", "id"),)

class NarcoticPill(Base):
    __tablename__ = "narcotics_pills"

    narcotic_id: Mapped[int] = mapped_column(
        ForeignKey("narcotics.id", ondelete="CASCADE"), primary_key=True
    )
    color: Mapped[str | None] = mapped_column(String(50))
    diameter_mm: Mapped[float | None] = mapped_column(Numeric(5, 2))
    thickness_mm: Mapped[float | None] = mapped_column(Numeric(5, 2))
    edge_shape: Mapped[str | None] = mapped_column(String(50))

    narcotic = relationship("Narcotic", back_populates="pill_info")

    __table_args__ = (
        PrimaryKeyConstraint("narcotic_id", name="pk_narcotics_pills"),
        {"comment": "Pills information linked to narcotics"},
    )