// backend/src/models/Usuario.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("./index");

const dialect = typeof sequelize.getDialect === "function"
  ? sequelize.getDialect()
  : "postgres";

// JSONB en Postgres; JSON en otros (evita error de tipo no reconocido)
const JSON_FLEX = dialect === "postgres" ? DataTypes.JSONB : DataTypes.JSON;

const Usuario = sequelize.define(
  "usuario",
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    apellido: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    correo_institucional: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    contrasenia: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    // ✅ tipo_usuario explícito + validación
    tipo_usuario: {
      type: DataTypes.STRING(20), // DB sigue siendo VARCHAR
      allowNull: false,
      validate: { isIn: [["Pasajero", "Conductor"]] },
    },

    licencia_conducir: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    estado_disponibilidad: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    preferencia_tema: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "light",
    },

    calif_conductor_avg: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0,
    },
    calif_conductor_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    // ======= NUEVOS CAMPOS =======
    bio: {
      type: DataTypes.STRING(300),
      allowNull: true,
      validate: { len: [0, 300] },
    },
    emerg_contacto_nombre: {
      type: DataTypes.STRING(120),
      allowNull: true,
      validate: { len: [0, 120] },
    },
    emerg_contacto_telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: { len: [0, 20] },
    },

    // JSONB (Postgres) o JSON (otros). Si prefieres forzar TEXT, te dejo alternativa abajo.
    acces_necesidades: {
      type: JSON_FLEX,
      allowNull: true,
      // Si el dialecto NO es postgres, algunos drivers devuelven strings:
      // normalizamos en getter/setter.
      get() {
        const raw = this.getDataValue("acces_necesidades");
        if (raw == null) return null;
        if (typeof raw === "string") {
          try { return JSON.parse(raw); } catch { return null; }
        }
        return raw;
      },
      set(v) {
        if (v == null || v === "") {
          this.setDataValue("acces_necesidades", null);
        } else {
          // Acepta string JSON o objeto
          if (typeof v === "string") {
            try { this.setDataValue("acces_necesidades", JSON.parse(v)); }
            catch { this.setDataValue("acces_necesidades", v); }
          } else {
            this.setDataValue("acces_necesidades", v);
          }
        }
      },
    },
    // =============================
  },
  {
    tableName: "usuario",
    timestamps: false,
    underscored: false,
    defaultScope: {
      attributes: { exclude: ["contrasenia"] },
    },
  }
);

module.exports = Usuario;

/*
🔁 Alternativa si quieres blindarte 100% del dialecto:
Usa TEXT con JSON manual:

acces_necesidades: {
  type: DataTypes.TEXT,
  allowNull: true,
  get() {
    const raw = this.getDataValue("acces_necesidades");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  set(v) {
    if (!v) return this.setDataValue("acces_necesidades", null);
    this.setDataValue("acces_necesidades", typeof v === "string" ? v : JSON.stringify(v));
  }
}

*/
