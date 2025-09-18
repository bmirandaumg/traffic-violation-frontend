// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  Box,
  Button,
  Input,
  Text,
  Heading,
  VStack,
  Flex,
  Image,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../services/auth.service";

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

      navigate("/photos");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed");
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
        bg="gray.50"
        p={8}
      >
        <Box bg="black" p={8} rounded="lg" shadow="md" w="sm">
          <Heading mb={6} size="lg" textAlign="center">
            Login
          </Heading>
          <form onSubmit={handleSubmit}>
            <VStack gap={4} align="stretch" as="div">
              <Box>
                <Text mb={1} fontWeight="medium">
                  Número de empleado
                </Text>
                <Input
                  type="text"
                  placeholder="Número de empleado"
                  value={username}
                  onChange={(e) => setusername(e.target.value)}
                  required
                />
              </Box>

              <Box>
                <Text mb={1} fontWeight="medium">
                  Contraseña
                </Text>
                <Input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Box>

              <Button type="submit" colorScheme="blue" w="full" disabled={loading}>
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
          src="https://www.sicultura.gob.gt/wp-content/uploads/2019/12/MuniGua.jpg" // cambia esto por tu logo o imagen institucional
          alt="Institución"
          objectFit="cover"
          maxH="100%"
          maxW="100%"
        />
      </Flex>
    </Flex>
  );
};

export default LoginScreen;
