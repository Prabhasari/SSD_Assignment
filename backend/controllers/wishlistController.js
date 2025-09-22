import Wishlist from '../models/wishlistModel.js';
import sanitize from "mongo-sanitize";

//Add to wishlist
export const addToWishlist = async (req, res) => {
    try {
        // Sanitize user input
        const product = sanitize(req.body.product);
        const email = sanitize(req.body.email);

        // Validation
        if (!product) {
            return res.status(400).send({ message: 'Product is required' });
        }

        if (!email) {
            return res.status(400).send({ message: 'Email is required' });
        }

        // Check if the item already exists in the wishlist
        const existingWishlist = await Wishlist.findOne({ product: { $eq: product }, email: { $eq: email } });

        if (existingWishlist) {
            return res.status(200).send({
                success: false,
                message: 'This item is already added',
            });
        }

        // Save to wishlist
        const wishlist = await new Wishlist({ product, email }).save();

        res.status(201).send({
            success: true,
            message: 'Wishlist entry added successfully',
            wishlist
        });

    } catch (error) {
        console.error('Error adding to wishlist:', error);

        res.status(500).send({
            success: false,
            message: 'Error while adding to wishlist',
            error
        });
    }
};

//get all cart details 

export const getWishlist = async(req, res) =>{
    const{ email } =req.params;
    try {
        const wishlist = await Wishlist.find({email}).populate("product","_id  email name price quantity");
        if (!wishlist || wishlist.length === 0) {
            return res.status(404).send({
                success: false,
                message: "No wishlist details found for this email",
            });
        }
        res.status(200).send({
            success: true,
            message: "wishlist details retrieved successfully",
            wishlist,
        });
        
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error while retrieving cart details",
        });
        
    }
};

// Delete from wishlist
export const deleteWishlistItem = async (req, res) => {
    try {
        // Sanitize the ID to prevent NoSQL injection
        const id = sanitize(req.params.id);

        // Validate that it's a valid MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).send({
                success: false,
                message: "Invalid wishlist item ID",
            });
        }

        await Wishlist.findByIdAndDelete(id);

        res.status(200).send({
            success: true,
            message: "Wishlist item deleted successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while deleting wishlist item",
            error,
        });
    }
};