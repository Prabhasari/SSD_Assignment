import slugify from "slugify"
import promotionModel from "../models/promotionModel.js"
import fs from 'fs'
import sanitize from "mongo-sanitize";
import path from "path"; 

// Constants for file security
const UPLOAD_DIR = path.join(process.cwd(), "uploads"); // safe upload dir
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 1 * 1024 * 1024; // 1 MB

export const createPromotionController = async(req,res) => {
    try{
        const {
            promotionTitle,
            slug,
            promotionDescription,
            discountType,
            discountValue,
            startDate,
            endDate,
            termsConditions,
            promoCode,
            applicableItems,
            shop,
            isActive
        } = req.fields
        const {promotionImage} = req.files

        //validation
        switch(true){
            case !promotionTitle:
                return res.status(500).send({error:'Promo title is required'})
            case !promotionDescription:
                    return res.status(500).send({error:'Promo description is required'})
            case !discountType:
                    return res.status(500).send({error:'Discount type is required'})
            case !discountValue:
                return res.status(500).send({error:'Discount value is required'})
            case !startDate:
                return res.status(500).send({error:'Promo start date is required'})
            case !endDate:
                return res.status(500).send({error:'Promo end date is required'})
            case !shop:
                return res.status(500).send({error:'Offering shop is required'})
            case !isActive:
                return res.status(500).send({error:'Activation is required'}) 
              
        }

        const promotions = new promotionModel({...req.fields,slug:slugify(promotionTitle)})

        if(promotionImage){
            //  Validate file type
            if (!ALLOWED_TYPES.includes(promotionImage.type)) {
                return res.status(400).send({ error: "Invalid file type" });
            }

            //  Validate file size
            if (promotionImage.size > MAX_SIZE) {
                return res.status(400).send({ error: "Image must be less than 1MB" });
            }

            //  Prevent path traversal attacks
            const safeFileName = path.basename(promotionImage.path); 
            const safePath = path.join(UPLOAD_DIR, safeFileName);

            //  Read only from safePath
            promotions.promotionImage.data = fs.readFileSync(safePath);
            promotions.promotionImage.contentType = promotionImage.type;
        }
        await promotions.save();
        res.status(201).send({
            success:true,
            message:"Promotion created successfully",
            promotions
        })
    }catch(error){
    console.log(error)
    res.status(500).send({
        success:false,
        error,
        message:'Error in creating promotion'
    })
    }
}

export const getAllPromotionsController = async(req, res) => {
    try {
        const promotions = await promotionModel
            .find({})
            .populate('shop', 'shopname')  // populate only the shopname field
            .select("-promotionImage")
            .limit(20)
            .sort({ createdAt: -1 });
        
        res.status(200).send({
            success: true,
            countTotal: promotions.length,
            message: "All promotions",
            promotions
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error in getting promotions",
            error: error.message
        });
    }
};


export const getSinglePromotionsController = async (req, res) => {
    try {
        // Sanitize input
        const slug = sanitize(String(req.params.slug));

        // Optional: validate slug is not empty
        if (!slug) {
            return res.status(400).send({
                success: false,
                message: "Promotion slug is required",
            });
        }

        // Fetch promotion safely
        const promotion = await promotionModel
            .findOne({ slug: { $eq: slug } }) // $eq blocks object injection
            .populate("shop")
            .select("-promotionImage");

        if (!promotion) {
            return res.status(404).send({
                success: false,
                message: "Promotion not found",
            });
        }

        res.status(200).send({
            success: true,
            message: "Single promotion fetched",
            promotion,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error while getting single promotion",
            error,
        });
    }
};


//get promotiom image
export const promotionImageController = async(req,res) => {
    try{
        const promotion = await promotionModel.findById(req.params.pid).select("promotionImage");
        if(promotion.promotionImage){
            res.set("Content-type",promotion.promotionImage.contentType);
            return res.status(200).send(promotion.promotionImage.data)
        }
    }
    catch(error){
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error while getting promotion image',
            error
        })
    }
}

//delete promotion
export const deletePromotionController = async (req, res) => {
    try {
        // Sanitize the ID to prevent NoSQL injection
        const pid = sanitize(String(req.params.pid));

        // Validate MongoDB ObjectId format
        if (!pid.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).send({
                success: false,
                message: "Invalid promotion ID",
            });
        }

        // Find and delete the promotion
        const deletedPromotion = await promotionModel.findByIdAndDelete(pid);

        if (!deletedPromotion) {
            return res.status(404).send({
                success: false,
                message: "Promotion not found",
            });
        }

        res.status(200).send({
            success: true,
            message: "Promotion deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error while deleting promotion",
            error,
        });
    }
};

//update promotion
export const updatePromotionController = async (req, res) => {
    try {
        // Sanitize the ID to prevent NoSQL injection
        const pid = sanitize(String(req.params.pid));

        // Validate MongoDB ObjectId format
        if (!pid.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).send({
                success: false,
                message: "Invalid promotion ID",
            });
        }

        // Update the promotion
        const promotion = await promotionModel.findByIdAndUpdate(pid, req.fields, { new: true });

        if (!promotion) {
            return res.status(404).send({
                success: false,
                message: "Promotion not found",
            });
        }

         //  Handle image upload securely
        if (req.files && req.files.promotionImage) {
            const file = req.files.promotionImage;

            // validate type
            if (!ALLOWED_TYPES.includes(file.type)) {
                return res.status(400).send({ error: "Invalid file type" });
            }

            // validate size
            if (file.size > MAX_SIZE) {
                return res.status(400).send({ error: "Image must be less than 1MB" });
            }

            // ensure safe path
            const safeFileName = path.basename(file.path);
            const safePath = path.join(UPLOAD_DIR, safeFileName);

            promotion.promotionImage.data = fs.readFileSync(safePath);
            promotion.promotionImage.contentType = file.type;
        }

        await promotion.save();

        res.status(200).send({
            success: true,
            message: "Promotion updated successfully",
            promotion,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error while updating promotion",
            error,
        });
    }
};

// Get promotions by shop
export const getPromotionByShopController = async (req, res) => {
    try {
        const promotions = await promotionModel.find({ shop: req.params.shopId });
        res.status(200).send({
            success: true,
            promotions,
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: 'Error fetching promotions',
            error,
        });
    }
};

// Controller to get total user and shop count
export const getTotalPromoCountController = async (req, res) => {
    try {
        // Get the total count of shops
        const promoCount = await promotionModel.countDocuments();
  
        res.status(200).send({
            success: true,
            message: "Total promotion count fetched successfully",
            data: {
                totalPromotions: promoCount,
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
  