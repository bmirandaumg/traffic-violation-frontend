// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  Box,
  Button,
  Input,
  Text,
  // Heading,
  VStack,
  Flex,
  Image,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../services/auth.service";
import axios from "axios";
import muniBuild from "../assets/muniBuild.jpg";
import muniLogo from "../assets/muniLogo.jpg";

const LoginScreen: React.FC = () => {
  const [username, setusername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = { username, password };

    try {
      const response = await AuthService.login(payload);

      localStorage.setItem("accessToken", response.access_token);
      localStorage.setItem("userEmail", response.email);
      localStorage.setItem("userName", response.username);
      localStorage.setItem("userId", response.userId.toString());

      navigate("/photos");
    } catch (err) {
      console.error("Login error:", err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Login failed");
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh">
      {/* Columna izquierda - Formulario */}
      <Flex
        flex={1}
        align="center"
        justify="center"
        bg="#f3f4f6"
        p={8}
      >
        <Box bg="#fff" p={8} rounded="lg" shadow="md" w="sm">
          <Image
  src={muniLogo}
  alt="Logo Municipalidad"
  width="180px"
  height="auto"
  objectFit="contain"
  mx="auto"
  mb={4}
/>

          {/* <Heading mb={6} size="lg" textAlign="center" color="#222">
            Inicio de Sesión
          </Heading> */}
          <form onSubmit={handleSubmit}>
            <VStack gap={4} align="stretch" as="div">
              <Box>
                <Text mb={1} fontWeight="medium" color="#374151">
                  Número de empleado
                </Text>
                <Input
                  type="text"
                  placeholder="Número de empleado"
                  value={username}
                  onChange={(e) => setusername(e.target.value)}
                  required
                  bg="#f9fafb"
                  color="#222"
                  borderColor="#cbd5e1"
                  _placeholder={{ color: '#6b7280' }}
                />
              </Box>

              <Box>
                <Text mb={1} fontWeight="medium" color="#374151">
                  Contraseña
                </Text>
                <Input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  bg="#f9fafb"
                  color="#222"
                  borderColor="#cbd5e1"
                  _placeholder={{ color: '#6b7280' }}
                />
              </Box>

              <Button
                type="submit"
                bg="#16A34A"
                color="#fff"
                w="full"
                _hover={{ bg: '#15803D' }}
                disabled={loading}
                fontWeight="bold"
                borderRadius="md"
                shadow="sm"
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
              {error && <Text color="red.500">{error}</Text>}
            </VStack>
          </form>
        </Box>
      </Flex>

      {/* Columna derecha - Imagen */}
      <Flex flex={1} align="center" justify="center" bg="black">
        <Image
          src={muniBuild}
          alt="Institución"
          objectFit="cover"
          width="100%"
          height="100%"
        />
      </Flex>
    </Flex>
  );
};

export default LoginScreen;
