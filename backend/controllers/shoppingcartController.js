import Cart from '../models/shoppingcartModel.js';
import sanitize from "mongo-sanitize";

//Add to cart 

export const addToCart = async (req,res) => {
    try {
        const{product, quantity,email } =req.body
        //validation
        if(!product){
            return res.send({message:'product is Required'});
        }
        if(!quantity){
            return res.send({message:'quantity is Required'});
        }
        
        if(!email){
            return res.send({message:'email is Required'});
        }
        //check cart
        const exisitingcart = await Cart.findOne({product,email});

        //exisit cart
        if(exisitingcart){
            return res.status(200).send({
                success:false,
                message:'This item is alradey added',
            });
        }
        //save
        const cart = await new Cart({product, quantity,email}).save();

        res.status(201).send({
            success:true,
            message:'Cart Entered Successfully',
            cart
        });

    }catch (error) {
        console.error('Error adding to cart:', error);

        res.status(500).send({
            success: false,
            message: 'Error in details entering',
            error
        });
    }
};



export const getCart = async(req, res) =>{
    const { email } = req.params;
    try {

        const cart = await Cart.find({ email }).populate("product", "name price quantity");
        
        
        if (!cart || cart.length === 0) {
            return res.status(404).send({
                success: false,
                message: "No Cart details found for this email",
            });
        }

        res.status(200).send({
            success: true,
            message: "Cart details retrieved successfully",
            cart,
        });

    } catch (error) {
        console.error("Error details:", error); // Enhanced logging
        res.status(500).send({
            success: false,
            error: error.message || error, // Return detailed error message
            message: "Error while retrieving cart details",
        });
    }
};



//update card details
export const updateCartItemQuantity = async (req, res) => {
    try {
        const { product, quantity } = req.body;
        
        // Sanitize and convert ID to string
        const id = sanitize(String(req.params.id));

        // Validate MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).send({
                success: false,
                message: "Invalid cart item ID",
            });
        }

        // Update cart item
        const cart = await Cart.findByIdAndUpdate(
            id,
            { product, quantity },
            { new: true }
        );

        if (!cart) {
            return res.status(404).send({
                success: false,
                message: "Cart item not found",
            });
        }

        res.status(200).send({
            success: true,
            message: "Quantity updated successfully",
            cart,
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error while updating cart quantity",
            error,
        });
    }
};


export const deleteCartItem = async (req, res) => {
    try {
        // Sanitize the ID to prevent NoSQL injection
        const id = sanitize(String(req.params.id));

        // Validate MongoDB ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).send({
                success: false,
                message: "Invalid cart item ID",
            });
        }

        // Find and delete the cart item
        const deletedItem = await Cart.findByIdAndDelete(id);

        if (!deletedItem) {
            return res.status(404).send({
                success: false,
                message: "Cart item not found",
            });
        }

        res.status(200).send({
            success: true,
            message: "Cart item deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error while deleting cart item",
            error,
        });
    }
};


//delete cart details after success the payment, this part belongs to kavin
export const deleteAllCartItem = async (req, res) =>{
    try {
        const { email } = req.params;
        await Cart.deleteMany({ email });
        res.status(200).send({
            success: true,
            message: "Cart Details Deleted Successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "error while deleting Card Details",
            error,
        });
    }
};