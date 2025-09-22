import Cart from '../models/shoppingcartModel.js';
import sanitize from "mongo-sanitize";

//Add to cart 
export const addToCart = async (req, res) => {
    try {
        // Sanitize inputs to prevent NoSQL injection
        const product = sanitize(req.body.product);
        const email = sanitize(req.body.email);
        const quantity = Number(req.body.quantity);

        // Validation
        if (!product) return res.status(400).json({ success: false, message: 'Product is required' });
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
        if (!quantity || isNaN(quantity) || quantity <= 0) return res.status(400).json({ success: false, message: 'Valid quantity is required' });

        // Check if item already exists in the cart
        const existingCart = await Cart.findOne({ product: {$eq:product}, email: {$eq:email} });
        if (existingCart) {
            return res.status(200).json({
                success: false,
                message: 'This item is already added to the cart',
            });
        }

        // Save to database
        const cart = await new Cart({ product, quantity, email }).save();

        res.status(201).json({
            success: true,
            message: 'Cart item added successfully',
            cart,
        });

    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error while adding to cart',
            error: error.message,
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
export const deleteAllCartItem = async (req, res) => {
  try {
    // Sanitize and validate email
    const email = sanitize(String(req.params.email));
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Validate proper email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Safe deletion using $eq to avoid NoSQL injection
    const result = await Cart.deleteMany({ email: { $eq: email } });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} cart items successfully`,
    });
  } catch (error) {
    console.error("Error deleting cart items:", error);
    res.status(500).json({
      success: false,
      message: "Error while deleting cart items",
      error: error.message,
    });
  }
};
