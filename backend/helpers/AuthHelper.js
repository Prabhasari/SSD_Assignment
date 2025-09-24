import bcrypt from 'bcrypt';

// Hash a plaintext password
export const hashPassword = async (password) => {
    try{
        const saltRounds = 12;
        return await bcrypt.hash(password,saltRounds);       
    }catch(error){
        console.error("Error in hashing password",error);
        throw error;
    }
};

// Compare plaintext password with stored password
export const comparePassword = async (password,hashPassword) => {
    try{
        return await bcrypt.compare(password,hashPassword);
    } catch(error){
        console.error("Error in comparing password",error);
        throw error;
    }
};