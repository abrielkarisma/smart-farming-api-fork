const sequelize = require("../../model/index");
const Op = sequelize.Sequelize.Op;
const KategoriInventaris = sequelize.KategoriInventaris;
const { dataValid } = require("../../validation/dataValidation");
const { getPaginationOptions } = require("../../utils/paginationUtils");

const getAllKategoriInventaris = async (req, res) => {
  try {
    const { page, limit, nama } = req.query;
    const paginationOptions = getPaginationOptions(page, limit);

    const whereClause = { isDeleted: false };
    if (nama && nama.trim() !== "") {
      whereClause.nama = { [Op.like]: `%${nama}%` };
    }

    const { count, rows } = await KategoriInventaris.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      ...paginationOptions,
    });

    const currentPageNum = parseInt(page, 10) || 1;
    const totalPages = Math.ceil(
      count / (paginationOptions.limit || parseInt(limit, 10) || 10)
    );

    if (rows.length === 0) {
      return res.status(200).json({
        message: currentPageNum > 1 ? "No more data" : "Data not found",
        data: [],
        totalItems: count,
        totalPages: totalPages,
        currentPage: currentPageNum,
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved all kategori inventaris data",
      data: rows,
      totalItems: count,
      totalPages: totalPages,
      currentPage: currentPageNum,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getKategoriInventarisById = async (req, res) => {
  try {
    const data = await KategoriInventaris.findOne({
      where: {
        id: req.params.id,
        isDeleted: false,
      },
    });

    if (!data || data.isDeleted) {
      return res.status(404).json({
        message: "Data not found",
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved kategori inventaris data",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getKategoriInventarisSearch = async (req, res) => {
  try {
    const { nama } = req.params;
    const { page, limit } = req.query;
    const paginationOptions = getPaginationOptions(page, limit);

    const { count, rows } = await KategoriInventaris.findAndCountAll({
      where: {
        nama: { [Op.like]: `%${nama}%` },
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
      ...paginationOptions,
    });

    const currentPageNum = parseInt(page, 10) || 1;
    const totalPages =
      rows.length > 0
        ? Math.ceil(
            (await KategoriInventaris.count({
              where: { nama: { [Op.like]: `%${nama}%` }, isDeleted: false },
            })) / (paginationOptions.limit || parseInt(limit, 10) || 10)
          )
        : 0;

    if (rows.length === 0) {
      return res.status(200).json({
        message:
          currentPageNum > 1
            ? "No more data for this name"
            : "Data not found for this name",
        data: [],
        totalItems: totalPages,
        currentPage: currentPageNum,
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved kategori inventaris data by name",
      data: rows,
      totalItems: count,
      totalPages: totalPages,
      currentPage: currentPageNum,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getKategoriInventarisOnly = async (req, res) => {
  try {
    const data = await KategoriInventaris.findAll({
      where: {
        isDeleted: false,
        nama: { [Op.notIn]: ["Vitamin", "Pupuk", "Disinfektan", "Vaksin"] },
      },
      attributes: ["id", "nama"],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Successfully retrieved kategori inventaris data",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const createKategoriInventaris = async (req, res) => {
  const valid = {
    nama: "required",
  };
  const validation = await dataValid(valid, req.body);
  if (validation.message.length > 0) {
    return res.status(400).json({
      error: validation.message,
      message: "Validation error",
    });
  }
  try {
    // Cek apakah ada data dengan nama yang sama yang sudah di-soft delete
    const softDeleted = await KategoriInventaris.findOne({
      where: {
        nama: req.body.nama,
        isDeleted: true,
      },
    });

    if (softDeleted) {
      // Restore data yang sudah di-soft delete dengan update semua field
      await KategoriInventaris.update(
        {
          ...req.body,
          isDeleted: false,
          updatedAt: new Date(),
        },
        {
          where: { id: softDeleted.id },
        }
      );

      const restoredData = await KategoriInventaris.findOne({
        where: { id: softDeleted.id },
      });

      res.locals.createdData = restoredData.toJSON();

      return res.status(201).json({
        status: true,
        message:
          "Data with this name existed before and has been restored with new information",
        data: restoredData,
      });
    }

    // Cek apakah ada data aktif dengan nama yang sama
    const existing = await KategoriInventaris.findOne({
      where: {
        nama: req.body.nama,
        isDeleted: false,
      },
    });

    if (existing) {
      return res.status(400).json({
        status: false,
        message:
          "Kategori inventaris dengan nama tersebut sudah ada. Silakan gunakan nama yang berbeda.",
      });
    }

    // Buat data baru jika tidak ada duplikasi
    const data = await KategoriInventaris.create({
      ...req.body,
      isDeleted: false,
    });

    res.locals.createdData = data.toJSON();

    return res.status(201).json({
      status: true,
      message: "Successfully created new kategori inventaris data",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
      detail: error,
    });
  }
};

const updateKategoriInventaris = async (req, res) => {
  try {
    const data = await KategoriInventaris.findOne({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!data || data.isDeleted) {
      return res.status(404).json({
        status: false,
        message: "Data not found",
      });
    }

    // Jika nama diubah, cek apakah nama baru sudah ada
    if (req.body.nama && req.body.nama !== data.nama) {
      const existing = await KategoriInventaris.findOne({
        where: {
          nama: req.body.nama,
          isDeleted: false,
          id: { [Op.ne]: req.params.id }, // Exclude current record
        },
      });

      if (existing) {
        return res.status(400).json({
          status: false,
          message:
            "Kategori inventaris dengan nama tersebut sudah ada. Silakan gunakan nama yang berbeda.",
        });
      }
    }

    await KategoriInventaris.update(req.body, {
      where: {
        id: req.params.id,
      },
    });

    const updated = await KategoriInventaris.findOne({
      where: { id: req.params.id },
    });

    res.locals.updatedData = updated.toJSON();

    return res.status(200).json({
      status: true,
      message: "Successfully updated kategori inventaris data",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
      detail: error,
    });
  }
};

const deleteKategoriInventaris = async (req, res) => {
  try {
    const data = await KategoriInventaris.findOne({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!data || data.isDeleted) {
      return res.status(404).json({
        status: false,
        message: "Data not found",
      });
    }

    data.isDeleted = true;
    await data.save();

    res.locals.updatedData = data;

    return res.status(200).json({
      status: true,
      message: "Successfully deleted kategori inventaris data",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
      detail: error,
    });
  }
};

module.exports = {
  getAllKategoriInventaris,
  getKategoriInventarisById,
  getKategoriInventarisSearch,
  getKategoriInventarisOnly,
  createKategoriInventaris,
  updateKategoriInventaris,
  deleteKategoriInventaris,
};
