//Screen basic whit a list of photos
import React, { useEffect, useState } from 'react';
import { Box, Spinner, Text, Image, Button, } from '@chakra-ui/react';

import { PhotosService, type PhotoDetail, type Vehicle } from '@/services/photos.service';
import { VehicleService } from '@/services/vehicle.service';
import { useLocation, useNavigate } from 'react-router-dom';

const PhotoScreen: React.FC = () => {
    const [photoDetail, setPhotoDetail] = useState<PhotoDetail>();
    const [loading, setLoading] = useState<boolean>(true);
    const [date, setDate] = useState<string>("");
    const [time, setTime] = useState<string>("");
    const location = useLocation();
    const { photo } = location.state || {};
    const { photo_base64 } = photo || {};
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPhotoDetail = async () => {
            if (!photo || !photo.id) {
                setLoading(false);
                return;
            }
            try {
                const detail = await PhotosService.getById(photo.id);
                setPhotoDetail(detail);
                // Extraer fecha y hora si es posible
                if (detail.timestamp) {
                    const [fecha, hora] = detail.timestamp.split(' ');
                    setDate(fecha || "");
                    setTime(hora || "");
                }
            } catch (error) {
                console.error("Error al obtener el detalle de la foto:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPhotoDetail();
    }, [photo]);

    // Estado para consulta SAT
    const [showSatInputs, setShowSatInputs] = useState(false);
    const [satPlaca, setSatPlaca] = useState("");
    const [satTipo, setSatTipo] = useState("");
    const [satVehicle, setSatVehicle] = useState<Vehicle | null>(null);
    const [satError, setSatError] = useState<string>("");
    const [showSatError, setShowSatError] = useState<boolean>(true);

    const handleSatSearch = async () => {
        setSatError("");
        setShowSatError(true);
        setSatVehicle(null);
        try {
            const vehicle = await VehicleService.consultarVehiculo(satPlaca, satTipo);
            if (vehicle && vehicle.PLACA) {
                setSatVehicle(vehicle);
            } else {
                setSatError("No se encontró información para los datos ingresados.");
            }
        } catch (error) {
            setSatError("Error consultando el servicio SAT.");
        }
    };

    const processPhoto = async () => {
        if (!photoDetail || !photoDetail.consultaVehiculo || !photo) return;
        setLoading(true);
        try {
            const params = {
                cruise: photo.cruise || "", // Ajusta si tienes el dato correcto
                timestamp: photoDetail.timestamp ? new Date(photoDetail.timestamp) : new Date(),
                speed_limit_kmh: Number(photoDetail.speedLimit) || 0,
                current_speed_kmh: Number(photoDetail.measuredSpeed) || 0,
                lpNumber: photo.cruise || "", // Ajusta si tienes el dato correcto
                lpType: photoDetail.consultaVehiculo.TIPO,
                photoId: photoDetail.id
            };
            const data = await PhotosService.processPhoto(params);
            console.log(data);
            if (data.status === "processed")
                navigate("/photos");
        } catch (error) {
            console.error("Error processing photo:", error);
        } finally {
            setLoading(false);
        }
    };




    return (
        <Box p={4} backgroundColor="white" minH="100vh" color="black">
            <Text fontSize="2xl" mb={4} fontWeight="bold">
                Foto
            </Text>
            {loading ? (
                <Spinner size="xl" />
            ) : (
                <Box color="black" display="flex" flexDirection={{ base: 'column', md: 'row' }} gap={8}>
                    {/* Columna izquierda: Foto y botones */}
                    <Box flex={1} display="flex" flexDirection="column" alignItems="center">
                        {photo_base64 && (
                            <Box display="flex" justifyContent="center" alignItems="center" width="100%" mb={4}>
                                <Image
                                    src={`data:image/png;base64,${photo_base64}`}
                                    alt="Foto"
                                    maxWidth="800px"
                                    maxHeight="500px"
                                    width="100%"
                                    height="auto"
                                    objectFit="contain"
                                    borderRadius={8}
                                    boxShadow="md"
                                />
                            </Box>
                        )}
                        <Box width="100%" display="flex" flexDirection={{ base: 'column', md: 'row' }} gap={2} mt={4} justifyContent="center" alignItems="center">
                            <Button color="white" variant='outline' bg='#5cb85c' onClick={processPhoto}>
                                Procesar
                            </Button>
                            <Button 
                                color="white" 
                                variant='outline' 
                                bg='#007bff' 
                                onClick={() => {
                                    setShowSatInputs(v => {
                                        const newValue = !v;
                                        if (newValue) {
                                            setShowSatError(false);
                                            setSatError("");
                                            setSatVehicle(null);
                                        }
                                        return newValue;
                                    });
                                }}
                            >
                                Realizar Consulta en Sat
                            </Button>
                            <Button color="white" variant='outline' bg='#dc3545'>
                                Descartar
                            </Button>
                        </Box>
                    </Box>
                    {/* Columna derecha: Datos y vehículo */}
                    <Box flex={1} display="flex" flexDirection="column" gap={4}>
                        {photoDetail && (
                            <>
                                <Box p={2} borderWidth={1} borderRadius={8} bg="#f8f9fa" color="black">
                                    <Text fontWeight='bold'>Fecha:</Text>
                                    <Text>{date ?? '-'}</Text>
                                    <Text fontWeight='bold' mt={2}>Hora:</Text>
                                    <Text>{time ?? '-'}</Text>
                                    <Text fontWeight='bold' mt={2}>Ubicación:</Text>
                                    <Text>{photoDetail.location}</Text>
                                    <Text fontWeight='bold' mt={2}>Límite de velocidad:</Text>
                                    <Text>{photoDetail.speedLimit}</Text>
                                    <Text fontWeight='bold' mt={2}>Velocidad medida:</Text>
                                    <Text>{photoDetail.measuredSpeed}</Text>
                                </Box>
                                {photoDetail.consultaVehiculo ? (
                                    <Box p={2} borderWidth={1} borderRadius={8} bg="#f8f9fa" color="black">
                                        <Text fontWeight='bold'>Vehículo:</Text>
                                        <Text>TIPO: {photoDetail.consultaVehiculo.TIPO}</Text>
                                        <Text>MARCA: {photoDetail.consultaVehiculo.MARCA}</Text>
                                        <Text>LINEA: {photoDetail.consultaVehiculo.LINEA}</Text>
                                        <Text>MODELO: {photoDetail.consultaVehiculo.MODELO}</Text>
                                        <Text>COLOR: {photoDetail.consultaVehiculo.COLOR}</Text>
                                        <Text>USO: {photoDetail.consultaVehiculo.USO}</Text>
                                        <Text>PLACA: {photoDetail.consultaVehiculo.PLACA}</Text>
                                        <Text>CC: {photoDetail.consultaVehiculo.CC}</Text>
                                    </Box>
                                ) : photoDetail.isSatVehicleInfoFound === false && showSatError && !showSatInputs ? (
                                    <Box 
                                        display="flex"
                                        flexDirection="row"
                                        alignItems="center"
                                        justifyContent="center"
                                        gap={2}
                                        mt={2}
                                        p={2}
                                        borderWidth={1}
                                        borderRadius={8}
                                        bg="#fff5f5"
                                        borderColor="#feb2b2"
                                        maxWidth="420px"
                                        mx="auto"
                                    >
                                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#feb2b2"/><path d="M12 7v5" stroke="#c53030" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="16" r="1" fill="#c53030"/></svg>
                                        <Text color="#c53030" fontWeight="bold" whiteSpace="nowrap">No se encontró información SAT del vehículo.</Text>
                                    </Box>
                                ) : null}
                                {showSatInputs && (
                                    <>
                                        <Box mt={4} mb={2} display="flex" flexDirection={{ base: 'column', md: 'row' }} gap={2} alignItems="center" justifyContent="center">
                                            <input
                                                placeholder="Placa"
                                                value={satPlaca}
                                                onChange={e => setSatPlaca(e.target.value)}
                                                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                                            />
                                            <input
                                                placeholder="Tipo"
                                                value={satTipo}
                                                onChange={e => setSatTipo(e.target.value)}
                                                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                                            />
                                            <Button color="white" variant='outline' bg='#343a40' onClick={handleSatSearch}>
                                                Buscar
                                            </Button>
                                        </Box>
                                        {satError && <Text color="red.500" mt={2}>{satError}</Text>}
                                    </>
                                )}
                            </>
                        )}
                        {satVehicle && (
                            <Box mt={2} p={3} borderWidth={1} borderRadius={8} bg="#f8f9fa" color="black">
                                <Text fontWeight='bold'>Resultado SAT:</Text>
                                <Text>ESTADO: {satVehicle.ESTADO}</Text>
                                <Text>PLACA: {satVehicle.PLACA}</Text>
                                <Text>MARCA: {satVehicle.MARCA}</Text>
                                <Text>LINEA: {satVehicle.LINEA}</Text>
                                <Text>MODELO: {satVehicle.MODELO}</Text>
                                <Text>COLOR: {satVehicle.COLOR}</Text>
                                <Text>TIPO: {satVehicle.TIPO}</Text>
                                <Text>USO: {satVehicle.USO}</Text>
                                <Text>CC: {satVehicle.CC}</Text>
                            </Box>
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    );
}
export default PhotoScreen;