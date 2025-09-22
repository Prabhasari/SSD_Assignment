import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
import { z } from "zod";

// Zod schema for category validation
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

// ==================== CREATE CATEGORY ====================
export const createCategoryController = async (req, res) => {
  try {
    // validate input
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.errors });
    }

    const { name } = parsed.data;

    // safe query with $eq
    const existingCategory = await categoryModel.findOne({ name: { $eq: name } });
    if (existingCategory) {
      return res.status(409).send({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await new categoryModel({
      name,
      slug: slugify(name),
    }).save();

    res.status(201).send({
      success: true,
      message: "New category created",
      category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in category creation",
      error: error.message,
    });
  }
};

// ==================== UPDATE CATEGORY ====================
export const updateCategoryController = async (req, res) => {
  try {
    // validate input
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.errors });
    }

    const { name } = parsed.data;
    const { id } = req.params;

    // cast id to string to prevent object injection
    const category = await categoryModel.findByIdAndUpdate(
      String(id),
      { name, slug: slugify(name) },
      { new: true }
    );

    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error while updating category",
      error: error.message,
    });
  }
};

// ==================== GET ALL CATEGORIES ====================
export const categoryController = async (req, res) => {
  try {
    const category = await categoryModel.find({});
    res.status(200).send({
      success: true,
      message: "All categories list",
      category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error while getting all categories",
      error: error.message,
    });
  }
};

// ==================== GET SINGLE CATEGORY ====================
export const singleCategoryController = async (req, res) => {
  try {
    const { slug } = req.params;

    // safe query using $eq
    const category = await categoryModel.findOne({ slug: { $eq: slug } });

    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Get single category successfully",
      category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error while getting single category",
      error: error.message,
    });
  }
};

// ==================== DELETE CATEGORY ====================
export const deleteCategoryController = async (req, res) => {
  try {
    const { id } = req.params;

    // cast id to string
    const deleted = await categoryModel.findByIdAndDelete(String(id));

    if (!deleted) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting category",
      error: error.message,
    });
  }
};
