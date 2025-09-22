import { error } from "console";
import LostModel from "../models/LostAndFoundModel.js";
import LostNotify from "../models/LostFoundNotifyModel.js"
import fs from 'fs'
import sanitize from "mongo-sanitize";


//Add new lost Found item
export const AddItemController = async(req,res) => {
    try {
        const {name,pNumber,Description,role,email,itemName} = req.body
        // const {image} = req.files.file;
        const {image} = req.files

        // Validation
        switch(true){
            case !name:
                return res.status(500).send({error:'Name is Required'})
            case !pNumber:
                return res.status(500).send({error:"Phone Number is Required"})
            case !role:
                return res.status(500).send({error:"role is Required"})
            case !itemName:
                return res.status(500).send({error:"item is Required"})
            case image && image.size > 1000000:
                return res.status(500).send({error:"Photo is Required and should be less than 1mb"})
        }

        // const savedItem = await AddLostItem.save();
        //     res.status(200).json({ ID: savedItem._id });

            // const LostItems = new LostModel({name,pNumber,Description,role,email});
            // if(image && image.data && image.mimetype){
            //     console.log(image)
            //     LostItems.image.data = image.data;
            //     LostItems.image.contentType = image.mimetype;
            // }
            // await LostItems.save();
            // res.status(201).send({
            //     success: true,
            //     message: "Lost Item added successfully",
            //     LostItems,
            // });

            // Create new LostItem document
        const LostItems = new LostModel({ name, pNumber, Description, role, email, itemName });
        // const LostItems = new LostModel({ ...req.fields });

        // Handle image upload
        if (image && image.data && image.mimetype) {
            LostItems.image.data = image.data;
            LostItems.image.contentType = image.mimetype;
        }
        // if(image){
        //     LostItems.image.data = fs.readFileSync(image.path)
        //     LostItems.image.contentType = image.type
        // }

        // Save the document
        await LostItems.save();
        res.status(201).send({
            success: true,
            message: "Lost Item added successfully",
            LostItems,
        });
        
    } catch (error) {
        console.log(error);
            res.status(500).send({
                success:false,
                error,
                message:"Error in lost item adding",
            });
    }
}

// // Get all Items controller
export const getLostItemController = async(req,res) =>{
    try {
        const Items = await LostModel.find({}).select("-image").limit(12).sort({createdAt: -1});
        res.status(200).send({
            success:true,
            counTotal: Items.length,
            message:"All Items",
            Items,
        });
        
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:"Error in getting Items",
            error: error.message,
        });
    }
};

// Get Item photo controller
export const ItemPhotoController = async(req,res) => {
    try {
        const item = await LostModel.findById(req.params.pid).select("image");
        if(item.image.data){
            res.set("Content-type",item.image.contentType);
            return res.status(200).send(item.image.data);
        }
        
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:"Error while getting photo",
            error,
        });
        
    }
};

//delete item
export const deleteLostItemController = async (req, res) => {
    try {
        // Sanitize and cast ID to string
        const id = sanitize(String(req.params.id));

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({
                success: false,
                message: "Invalid Lost Item ID",
            });
        }

        // Attempt to delete the lost item
        const deletedItem = await LostModel.findByIdAndDelete(id);

        if (!deletedItem) {
            return res.status(404).send({
                success: false,
                message: "Lost item not found",
            });
        }

        res.status(200).send({
            success: true,
            message: "Lost item removed successfully",
            item: deletedItem,
        });

    } catch (error) {
        console.error("Error deleting lost item:", error);
        res.status(500).send({
            success: false,
            message: "Error while deleting lost item",
            error: error.message,
        });
    }
};


//get single lost Item
export const getLostSingleItemController = async(req,res) => {
    try{
        const SingleItem = await LostModel.findById(req.params.Iid).select("-image")
        res.status(200).send({
            success:true,
            message:"Single Item fetched",
            SingleItem
        })
    }
    catch(error){
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error while getting single Item',
            error
        })
    }
}

//store notification details
export const addNotifyControll = async (req, res) => {
    try {
        // Sanitize Item ID to prevent NoSQL injection
        const Iid = sanitize(String(req.params.Iid));

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(Iid)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Item ID",
            });
        }

        const { userName, userPNumber, email } = req.body;

        // Basic validation
        if (!userName) return res.status(400).json({ success: false, message: 'Name is required' });
        if (!userPNumber) return res.status(400).json({ success: false, message: 'Phone Number is required' });
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        // Check if notification already exists
        const existingEmailNotify = await LostNotify.findOne({ ItemID: { $eq: Iid }, email:{$eq:email} });
        if (existingEmailNotify) {
            return res.status(200).json({
                success: true,
                message: 'You have already sent notification',
            });
        }

        // Save to database
        const notifyDetails = await new LostNotify({ userName, userPNumber, email, ItemID: Iid }).save();

        res.status(201).json({
            success: true,
            message: 'Notification sent successfully',
            notifyDetails,
        });

    } catch (error) {
        console.error("Error sending notification:", error);
        res.status(500).json({
            success: false,
            message: "Error sending notification",
            error: error.message,
        });
    }
};

// // Get all Items controller
export const getAllLostNotify = async(req,res) =>{
    try {
        const notifies = await LostNotify.find({}).populate('ItemID').limit(12).sort({createdAt: -1});
        res.status(200).send({
            success:true,
            // counTotal: Items.length,
            message:"All Notification",
            notifies,
        });
        
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:"Error in getting Notification",
            error: error.message,
        });
    }
};

//delete Notification
export const deleteLostNotifyController = async (req, res) =>{
    try {
        const { ItemID } = req.params;


        // await LostNotify.deleteMany(ItemID);
        res.status(200).send({
            success: true,
            // message: "Items Removed Successfully",
        });
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            // message: "error while deleting Address",
            error,
        });
    }
};