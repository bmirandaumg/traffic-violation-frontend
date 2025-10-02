// src/components/MasterPage.tsx
import React from "react";
import { Box, Flex, Image, Text, VStack, Button } from "@chakra-ui/react";
import {FaUser} from "react-icons/fa";



const Header: React.FC = () => {

    const handleLogout = () => {
      localStorage.clear();
      window.location.href = "/"; // Redirige al usuario a la página de inicio
    }
    // Datos de usuario simulados
    const userName = localStorage.getItem("userEmail") || "";
    const userCode = localStorage.getItem("userName") || "";// Reemplaza con la URL real de la foto de perfil
  return (
    <Box position="relative" h="200px" w="100%">
    {/* Background Image */}
    <Image
      src="https://aprende.guatemala.com/wp-content/uploads/2018/08/Historia-del-Palacio-Municipal-de-la-Ciudad-de-Guatemala.jpg" // reemplaza con tu imagen
      alt="Header Background"
      objectFit="cover"
      w="100%"
      h="100%"
    />
    {/* Gradient Overlay */}
    <Box
      position="absolute"
      top={0}
      left={0}
      w="100%"
      h="100%"
      bgGradient="linear(to-b, rgba(0,0,0,0.5), rgba(0,0,0,0.1))"
    />
    {/* User Info */}
    <Flex
      position="absolute"
      top={4}
      right={4}
      align="center"
      color="black"
      backgroundColor={"whiteAlpha.800"}
      borderRadius={"md"}
      padding={2}
    >
      <FaUser size={60} style={{ marginRight: "16px", borderRadius: "50%", color:"#83D00D"   }} />
      <VStack gap={0} align="flex-start">
        <Text fontWeight="bold">{userName}</Text>
        <Text fontSize="sm">{userCode}</Text>
        <Button 
        bg="#83D00D"
        color="white"
        size="sm"
        mt={2}
        onClick={handleLogout}
        _hover={{ bg: "#6bb300" }}
        >
          Cerrar sesión
        </Button>
      </VStack>
    </Flex>
  </Box>
  );
};

export default Header;
 