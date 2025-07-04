module.exports = (sequelize, DataTypes) => {
  const Komoditas = sequelize.define(
    "Komoditas",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      nama: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      gambar: {
        type: DataTypes.STRING,
      },
      jumlah: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      hapusObjek: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      tipeKomoditas: {
        type: DataTypes.ENUM("individu", "kolektif"),
        allowNull: false,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      produkId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "produk",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
    },
    {
      tableName: "komoditas",
      freezeTableName: true,
    }
  );

  Komoditas.associate = (models) => {
    Komoditas.hasMany(models.Panen, {
      foreignKey: "komoditasId",
    });

    Komoditas.belongsTo(models.Satuan);
    Komoditas.belongsTo(models.JenisBudidaya);
  };

  return Komoditas;
};
