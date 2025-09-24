import React, { useState, useEffect  } from 'react';
import Layout from '../../components/Layout/Layout';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from '../../context/auth';
import { Container,Link, Box, Typography, TextField, Button, Paper } from '@mui/material';
import Google from '../../assets/googleG.png'; 

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const [auth, setAuth] = useAuth();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const user = params.get("user");
        console.log(params)
        console.log("token",token)
        console.log("user",user)

    if (token && user) {
        setAuth({
            ...auth,
            token,
            user,
        });

        

        localStorage.setItem(
            "auth",
            JSON.stringify({
            token,
            user: JSON.parse(decodeURIComponent(user)),
        })
    );

      navigate("/"); // redirect to home/dashboard
    }
  }, [navigate]);

    const handleLoginClick = () => {
      navigate('/register'); // Redirect to the login page
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
            const res = await axios.post("/api/v1/userauth/userLogin", { email, password });
            if (res && res.data.success) {
                const { token, user, shop, role } = res.data;
    
                // Update auth context with user/shop/admin details
                setAuth({
                    ...auth,
                    token,
                    user,
                    shopOwner: role === 2 ? shop : null,  // Only store shop if the user is a shop owner
                });
    
                // Store the token and user/shop/admin details in localStorage
                localStorage.setItem("auth", JSON.stringify({
                    token,
                    user,
                    shopOwner: role === 2 ? shop : null,
                }));
    
                // Redirect based on role
                if (role === 2) {
                    navigate('/shopProfile');  // Redirect shop owners to shop profile
                } else {
                    navigate('/');  // Redirect others to homepage
                }
    
                toast.success("Login successful");
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            console.log("Error:", error);
            toast.error("Something went wrong");
        }
    };    

    const googleAuth = () => {
        window.open(
            `${process.env.REACT_APP_API}/api/v1/userauth/google/callback`,
            "_self"
        )
    }    

    return (
        <Layout>
            <Container maxWidth="xs">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        marginTop: 8,
                    }}
                >
                    <Paper elevation={3} sx={{ padding: 3, width: '100%' }}>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{
                                textAlign: 'center',
                                fontWeight: 'bold',
                                marginBottom: 2,
                            }}
                        >
                            Login
                        </Typography>
                        <form onSubmit={handleSubmit}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                }}
                            >
                                <TextField
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    fullWidth
                                />
                                <TextField
                                    label="Password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    fullWidth
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    sx={{ marginTop: 2 }}
                                >
                                    Login
                                </Button>
                            </Box>
                        </form>
                        <br/>
                        <div>
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <hr style={{ flex: 1, border: "none", borderTop: "1px solid " }} />
                                <p style={{ margin: "0 10px" }}>or</p>
                                <hr style={{ flex: 1, border: "none", borderTop: "1px solid #121212ff" }} />
                            </div>
                            <br/>
                            <button
                                sx={{ marginTop: 2 }} onClick={googleAuth} 
                                style={{
                                    width:'100%',
                                    paddingTop: '2px',
                                    paddingBottom: '2px',
                                    borderRadius: '5px'
                                    
                                }}>
                                <img src= {Google} alt= "google icon" 
                                    style={{
                                        width: '50px', // Set desired width
                                        height: '25px', // Set desired height
                                        marginRight: '16px', // Space between logo and title
                                    }}/>
                                <span> Sing in with Google</span>
                            </button>
                        </div><br/>
                        <Box sx={{display: 'flex',flexDirection: 'column',alignItems: 'center',justifyContent: 'center'}}>
                        <Typography variant="body2">If forgot password,Click Here
                            <Link href="/forgot-password"> Forgot Password?</Link>
                        </Typography>
                        <br/>
                        <Typography>If you Don't have an Account, Please
                            <Link component="button" variant="body2" onClick={handleLoginClick} sx={{ cursor: 'pointer', color: 'blue', marginLeft: 1 }}>
                            Register
                            </Link>
                        </Typography>
                  </Box>
                </Paper>
            </Box>
            </Container>
        <Toaster />
    </Layout>
    );
};

export default Login;
