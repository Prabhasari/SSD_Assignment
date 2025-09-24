import { error } from "console";
import productModel from "../models/productModel.js";
import fs from 'fs'
import slugify from 'slugify';
import sanitize from "mongo-sanitize";
import path from "path";

// create product
export const createProductController = async (req,res) => {
    try {
        const {name,slug,description,price,category,quantity,email,reorderLevel} = req.fields
        const {photo} = req.files
        //validation
        switch(true){
            case !name:
                return res.status(500).send({error:'Name is Required'})
            case !description:
                return res.status(500).send({error:'Description is Required'})
            case !price:
                return res.status(500).send({error:'Price is Required'})
            case !category:
                return res.status(500).send({error:'Category is Required'})
            case !quantity:
                return res.status(500).send({error:'Quantity is Required'})
            case !email:
                return res.status(500).send({error:'email is Required'})
            case reorderLevel !== undefined && isNaN(reorderLevel):
                return res.status(500).send({ error: 'Reorder Level should be a number' });
            case photo && photo.size > 1000000:
                return res.status(500).send({error:'Photo is Required and less than 1MB'})
        }

        const products = new productModel({...req.fields, slug:slugify(name)})
        if(photo){
            // Secure file path check
            const uploadDir = path.resolve("uploads");
            const safePath = path.resolve(photo.path);

            if (!safePath.startsWith(uploadDir)) {
                return res.status(400).send({ error: "Invalid file path" });
            }

            products.photo.data = fs.readFileSync(safePath);
            products.photo.contentType = photo.type;
        }

        await products.save()
        res.status(201).send({
            success:true,
            message:'Product Created Successfully',
            products
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            error,
            message:'Error in Creating Product'
        })
    }
};


// get all products
export const getProductController = async (req,res) => {
    const {email} = req.params;
    try {
        const products = await productModel.find({email}).populate('category').select("-photo").sort({createdAt:-1});
        res.status(200).send({
            success:true,
            countTotal:products.length,
            message:"All Products",
            products,
        });
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error in getting Products',
            error: error.message
        })
    }
};

// get all products
export const getAllProductController = async (req,res) => {
    // const {email} = req.params;
    try {
        const products = await productModel.find({}).populate('category').select("-photo").sort({createdAt:-1});
        res.status(200).send({
            success:true,
            countTotal:products.length,
            message:"All Products",
            products,
        });
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error in getting Products',
            error: error.message
        })
    }
};

// get single product
export const getSingleProductController = async (req,res) => {
    const {slug} = req.params
    try {
        const product = await productModel.find({slug}).select("-photo").populate("category");
        res.status(200).send({
            success:true,
            message:'Single Product Fetched',
            product,
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error while getting single product',
            error
        })
    }
};


// get photo
export const productPhotoController = async (req,res) => {
    try {
        const product = await productModel.findById(req.params.pid).select("photo")
        if(product.photo.data){
            res.set('Content-type', product.photo.contentType)
            return res.status(200).send(product.photo.data);
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error while getting photo',
            error
        })
    }
};


export const deleteProductController = async (req, res) => {
    try {
        // Sanitize the ID to prevent NoSQL injection
        const pid = sanitize(String(req.params.pid));

        // Validate MongoDB ObjectId format
        if (!pid.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).send({
                success: false,
                message: "Invalid product ID",
            });
        }

        // Find and delete the product
        const deletedProduct = await productModel.findByIdAndDelete(pid).select("-photo");

        if (!deletedProduct) {
            return res.status(404).send({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).send({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error while deleting product",
            error,
        });
    }
};


export const updateProductController = async (req, res) => {
    try {
        const { name, description, price, category, quantity, shipping, reorderLevel } = req.fields;
        const photo = req.files?.photo;

        // Validation
        switch(true){
            case !name:
                return res.status(400).send({ error: 'Name is Required' });
            case !description:
                return res.status(400).send({ error: 'Description is Required' });
            case !price:
                return res.status(400).send({ error: 'Price is Required' });
            case !category:
                return res.status(400).send({ error: 'Category is Required' });
            case !quantity:
                return res.status(400).send({ error: 'Quantity is Required' });
            case reorderLevel !== undefined && isNaN(reorderLevel):
                return res.status(400).send({ error: 'Reorder Level should be a number' });
            case photo && photo.size > 1000000:
                return res.status(400).send({ error: 'Photo must be less than 1MB' });
        }

        // Sanitize and validate product ID
        const pid = sanitize(String(req.params.pid));
        if (!mongoose.Types.ObjectId.isValid(pid)) {
            return res.status(400).send({ success: false, message: "Invalid product ID" });
        }

        // Update product
        const updatedData = { ...req.fields, slug: slugify(name) };
        const product = await productModel.findByIdAndUpdate(pid, updatedData, { new: true });

        if (!product) {
            return res.status(404).send({ success: false, message: "Product not found" });
        }

        // Handle photo upload
        if (photo) {
           const uploadDir = path.resolve("uploads");
           const safePath = path.resolve(photo.path);

        if (!safePath.startsWith(uploadDir)) {
           return res.status(400).send({ error: "Invalid file path" });
        }

        product.photo.data = fs.readFileSync(safePath);
        product.photo.contentType = photo.mimetype;
        await product.save();
        }


        res.status(200).send({
            success: true,
            message: "Product updated successfully",
            product,
        });

    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).send({
            success: false,
            message: "Error updating product",
            error,
        });
    }
};


// piyusha product filter part

export const productFiltersController = async (req, res) => {
    try {
        const { checked, radio } = req.body;
        let args = {};
        if (checked.length > 0) args.category = checked;
        if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] }; 
        const products = await productModel.find(args);
        res.status(200).send({
            success: true,
            products,
        });
    } catch (error) {
        console.log(error);
        res.status(400).send({
            success: false,
            message: "Error while Filtering Products",
            error,
        });
    }
};


//piyusha product count
export const productCountController = async (req,res) => {
    try {
        const total = await productModel.find({}).estimatedDocumentCount();
        res.status(200).send({
            success: true,
            total,
        });
    } catch (error) {
        console.log(error)
        res.status(400).send({
            message:'Error in product count',
            error,
            success:false
        })
    }
}

//piyusha product list base on page
export const productListController = async (req,res) => {
    try {
        const perPage = 6;
        const page = req.params.page ? req.params.page : 1;
        const products = await productModel
           .find({})
           .select("-photo")
           .skip((page - 1) * perPage)
           .limit(perPage)
           .sort({ createdAt: -1 });
        res.status(200).send({
            success: true,
            products,
        });
    } catch (error) {
        console.log(error)
        res.status(400).send({
            success:false,
            message:'error in per page ctrl',
            error,
        });
    }
};


// Controller to get total products count-sandamini
export const getTotalProductCountController = async (req, res) => {
    try {
        // Get the total count of shops
        const productCount = await productModel.countDocuments();
  
        res.status(200).send({
            success: true,
            message: "Total product count fetched successfully",
            data: {
                totalProducts: productCount,
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching total counts",
            error: error.message,
        });
    }
  };

// piyusha mongodb update product quantity part
export const updateProductQuantity = async (req, res) => {
    try {
        // Sanitize input
        const quantity = sanitize(req.body.quantity);
        const pid = sanitize(String(req.params.pid));

        // Validate product ID
        if (!mongoose.Types.ObjectId.isValid(pid)) {
            return res.status(400).send({
                success: false,
                message: "Invalid product ID",
            });
        }

        // Validate quantity
        if (quantity === undefined || isNaN(quantity)) {
            return res.status(400).send({
                success: false,
                message: "Quantity must be a valid number",
            });
        }

        // Update product quantity
        const product = await productModel.findByIdAndUpdate(
            pid,
            { quantity },
            { new: true }
        );

        if (!product) {
            return res.status(404).send({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).send({
            success: true,
            message: "Quantity updated successfully",
            product,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error while updating quantity",
            error,
        });
    }
};


//piyusha similar product
export const relatedProductController = async (req,res) => {
    try {
        const {pid, cid } = req.params;
        const products = await productModel
           .find({
            category: cid,
            _id: {$ne: pid},
           })
           .select("-photo")
           .limit(3)
           .populate("category");
           res.status(200).send({
            success: true,
            products,
           });
        
    } catch (error) {
        console.log(error)
        res.status(400).send({
            success:false,
            message:'error while getting related product',
            error
        })
    }
}


