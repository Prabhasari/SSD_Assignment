import eventModel from "../models/eventModel.js";
import sanitize from "mongo-sanitize";

//Add new lost Found item
export const AddNewEvent = async(req,res) => {
    try {
        const {title,venue,email,startDate,endDate,startTime,endTime} = req.body
        // const {image} = req.files?.image;
        let image;
        if (req.files && req.files.image) {
            image = req.files.image;
        }

        // Validation
        switch(true){
            case !title:
                return res.status(500).send({error:'Event Title is Required'})
            case !startDate:
                return res.status(500).send({error:"Start Date is Required"})
            case !endDate:
                return res.status(500).send({error:"End Date is Required"})
            case !venue:
                return res.status(500).send({error:"venue is Required"})
            case !email:
                return res.status(500).send({error:"email is Required"})
            case !startTime:
                return res.status(500).send({error:"email is Required"})
            case !endTime:
                return res.status(500).send({error:"email is Required"})
        }

            // Create new LostItem document
        const newEvent = new eventModel({title,venue,email,startDate,endDate,startTime,endTime });

        // Handle image upload
        if (image && image.data && image.mimetype) {
            if(image.size > 1000000){
                return res.status(500).send({error:"Photo is Required and should be less than 1mb"})
            }
            newEvent.image.data = image.data;
            newEvent.image.contentType = image.mimetype;
        }

        // Save the document
        await newEvent.save();
        res.status(201).send({
            success: true,
            message: "New event added successfully",
            newEvent,
        });
        
    } catch (error) {
        console.log(error);
            res.status(500).send({
                success:false,
                error,
                message:"Error adding new event",
            });
    }
}

// // Get all events controller
export const getALLEventController = async(req,res) =>{
    try {
        const events = await eventModel.find({}).select("-image").sort({createdAt: -1});
        res.status(200).send({
            success:true,
            counTotal: events.length,
            message:"All Items",
            events,
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

// Get product photo controller
export const EventPhotoController = async(req,res) => {
    try {
        const event = await eventModel.findById(req.params.pid).select("image");
        if(event.image.data){
            res.set("Content-type",event.image.contentType);
            return res.status(200).send(event.image.data);
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


export const deleteEventController = async (req, res) => {
    try {
        // Sanitize user input and cast to string
        const id = sanitize(String(req.params.id));

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({
                success: false,
                message: "Invalid event ID",
            });
        }

        // Attempt to delete the event
        const deletedEvent = await eventModel.findByIdAndDelete(id);

        if (!deletedEvent) {
            return res.status(404).send({
                success: false,
                message: "Event not found",
            });
        }

        res.status(200).send({
            success: true,
            message: "Event deleted successfully",
            event: deletedEvent,
        });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).send({
            success: false,
            message: "Error while deleting event",
            error,
        });
    }
};


//get single lostItem
export const getEventController = async(req,res) => {
    try{
        const SingleEvent = await eventModel.findById(req.params.Iid).select("-image")
        res.status(200).send({
            success:true,
            message:"Single Item fetched",
            SingleEvent
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

export const updateEventController = async (req, res) => {
    try {
        const { title, venue, email, startDate, endDate, startTime, endTime } = req.body;
        const image = req.files?.image;

        // Basic validation
        switch(true){
            case !title:
                return res.status(400).send({ error: 'Event Title is Required' });
            case !startDate:
                return res.status(400).send({ error: 'Start Date is Required' });
            case !endDate:
                return res.status(400).send({ error: 'End Date is Required' });
            case !venue:
                return res.status(400).send({ error: 'Venue is Required' });
            case !email:
                return res.status(400).send({ error: 'Email is Required' });
            case !startTime:
                return res.status(400).send({ error: 'Start Time is Required' });
            case !endTime:
                return res.status(400).send({ error: 'End Time is Required' });
        }

        // Sanitize and validate ID
        const id = sanitize(String(req.params._id));
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ success: false, message: "Invalid event ID" });
        }

        // Prepare update object
        const updateData = { title, venue, email, startDate, endDate, startTime, endTime };

        // Update the event
        const event = await eventModel.findByIdAndUpdate(id, updateData, { new: true });

        if (!event) {
            return res.status(404).send({ success: false, message: "Event not found" });
        }

        // Handle image upload
        if (image && image.data && image.mimetype) {
            if (image.size > 1000000) {
                return res.status(400).send({ error: "Image must be less than 1MB" });
            }
            event.image.data = image.data;
            event.image.contentType = image.mimetype;
            await event.save();
        }

        res.status(200).send({
            success: true,
            message: "Event updated successfully",
            event,
        });

    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).send({
            success: false,
            message: "Error updating event",
            error,
        });
    }
};

//store notification details
export const addNotifyControll = async(req,res) => {
    const { Iid } = req.params;
    try {
        const { userName, userPNumber,email } = req.body;

        if (!userName) {
            return res.status(400).send({ error: 'Name is required' });
        }
        if (!userPNumber) {
            return res.status(400).send({ error: 'Phone Number is required' });
        }
        if (!email) {
            return res.status(400).send({ error: 'email is required' });
        }
        if (!Iid) {
            return res.status(400).send({ error: 'Item ID is required' });
        }

        //check cart
        const exisitingEmailNotify = await LostNotify.findOne({ItemID:Iid,email});

        //exisit email
        if(exisitingEmailNotify){
            return res.status(200).send({
                success:true,
                message:'You Already send notification',
            });
        }

        //save to database
        const notifyDetails = await new LostNotify({userName,userPNumber,email,ItemID:Iid}).save();

        res.status(201).send({
            success:true,
            message:'Notification Send Successfully',
            notifyDetails,
        });

        
    } catch (error) {
        res.status(500).send({
            success:false,
            error,
            message:"Error in send Notification",
        });
        
    }
}