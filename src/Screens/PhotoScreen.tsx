    // ...existing code...
//Screen basic whit a list of photos
import React, { useEffect, useState } from 'react';
import { Box, Spinner, Text, Image, Button, } from '@chakra-ui/react';

import { PhotosService, type PhotoDetail, type Vehicle } from '@/services/photos.service';
import { VehicleService } from '@/services/vehicle.service';
import { useLocation, useNavigate } from 'react-router-dom';

const PhotoScreen: React.FC = () => {
    const [photoDetail, setPhotoDetail] = useState<PhotoDetail>();
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);
    // Estados originales para fecha y hora
    const [date, setDate] = useState<string>("");
    const [time, setTime] = useState<string>("");
    // Estados temporales para edición
    const [editDate, setEditDate] = useState("");
    const [editTime, setEditTime] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [editSpeedLimit, setEditSpeedLimit] = useState("");
    const [editMeasuredSpeed, setEditMeasuredSpeed] = useState("");
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
                // Extraer fecha y hora correctamente desde un string ISO
                if (detail.timestamp) {
                    const dateObj = new Date(detail.timestamp);
                    setDate(dateObj.toLocaleDateString('es-ES'));
                    setTime(dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                }
            } catch (error) {
                console.error("Error al obtener el detalle de la foto:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPhotoDetail();
    }, [photo]);

    // Sincronizar estados temporales al entrar en modo edición
    useEffect(() => {
        if (editMode && photoDetail) {
            setEditDate(date);
            setEditTime(time);
            setEditLocation(photoDetail.location || "");
            setEditSpeedLimit(photoDetail.speedLimit?.toString() || "");
            setEditMeasuredSpeed(photoDetail.measuredSpeed?.toString() || "");
        }
    }, [editMode, photoDetail, date, time]);

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
                            <Button color="white" variant='outline' bg='#5cb85c' onClick={processPhoto} disabled={editMode}>
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
                                disabled={editMode}
                            >
                                Realizar Consulta en Sat
                            </Button>
                            <Button color="white" variant='outline' bg='#dc3545' disabled={editMode}>
                                Descartar
                            </Button>
                        </Box>
                    </Box>
                    {/* Columna derecha: Datos y vehículo */}
                    <Box flex={1} display="flex" flexDirection="column" gap={4}>
                        {photoDetail && (
                            <>
                                <Box p={2} borderWidth={1} borderRadius={8} bg="#f8f9fa" color="black" maxWidth="1200px" minWidth="400px" mx="auto">
                                    <Text fontWeight="bold" fontSize="lg" mb={3} textAlign="center">Información del Vehiculo</Text>
                                    <Box as="form" display="grid" gridTemplateColumns="150px 1fr" rowGap={2} columnGap={2} alignItems="center">
                                        <label htmlFor="fecha-input" style={{ fontWeight: 'bold', textAlign: 'right' }}>Fecha:</label>
                                        {editMode ? (
                                            <input
                                                id="fecha-input"
                                                type="date"
                                                value={(() => {
                                                    if (!editDate) return '';
                                                    const [d, m, y] = editDate.split('/');
                                                    if (!d || !m || !y) return '';
                                                    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                                                })()}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val) {
                                                        const [y, m, d] = val.split('-');
                                                        setEditDate(`${d}/${m}/${y}`);
                                                    } else {
                                                        setEditDate('');
                                                    }
                                                }}
                                                style={{ width: '100%', background: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px' }}
                                            />
                                        ) : (
                                            <input
                                                id="fecha-input"
                                                value={date ?? '-'}
                                                disabled
                                                style={{ width: '100%', background: '#e2e8f0', border: 'none', borderRadius: 4, padding: '2px 8px' }}
                                            />
                                        )}
                                        <label htmlFor="hora-input" style={{ fontWeight: 'bold', textAlign: 'right' }}>Hora:</label>
                                        {editMode ? (
                                            <input
                                                id="hora-input"
                                                type="time"
                                                value={(() => {
                                                    if (!editTime) return '';
                                                    const [h, m] = editTime.split(":");
                                                    if (!h || !m) return '';
                                                    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
                                                })()}
                                                onChange={e => {
                                                    setEditTime(e.target.value);
                                                }}
                                                style={{ width: '100%', background: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px' }}
                                            />
                                        ) : (
                                            <input
                                                id="hora-input"
                                                value={time ?? '-'}
                                                disabled
                                                style={{ width: '100%', background: '#e2e8f0', border: 'none', borderRadius: 4, padding: '2px 8px' }}
                                            />
                                        )}
                                        <label htmlFor="ubicacion-input" style={{ fontWeight: 'bold', textAlign: 'right' }}>Ubicación:</label>
                                        <input id="ubicacion-input" value={editMode ? editLocation : (photoDetail.location || '')} disabled={!editMode} onChange={e => setEditLocation(e.target.value)} style={{ width: '100%', background: editMode ? '#fff' : '#e2e8f0', border: 'none', borderRadius: 4, padding: '2px 8px' }} />
                                        <label htmlFor="limite-input" style={{ fontWeight: 'bold', textAlign: 'right' }}>Límite de velocidad:</label>
                                        <input id="limite-input" type="number" value={editMode ? editSpeedLimit : (photoDetail.speedLimit ?? '')} disabled={!editMode} onChange={e => setEditSpeedLimit(e.target.value)} style={{ width: '100%', background: editMode ? '#fff' : '#e2e8f0', border: 'none', borderRadius: 4, padding: '2px 8px' }} />
                                        <label htmlFor="medida-input" style={{ fontWeight: 'bold', textAlign: 'right' }}>Velocidad medida:</label>
                                        <input id="medida-input" type="number" value={editMode ? editMeasuredSpeed : (photoDetail.measuredSpeed ?? '')} disabled={!editMode} onChange={e => setEditMeasuredSpeed(e.target.value)} style={{ width: '100%', background: editMode ? '#fff' : '#e2e8f0', border: 'none', borderRadius: 4, padding: '2px 8px' }} />

                                    {/* Botones Editar y Guardar */}
                                    <Box gridColumn="1 / span 2" display="flex" justifyContent="center" gap={4} mt={4}>
                                        <Button colorScheme="blue" disabled={!photoDetail || editMode} onClick={() => setEditMode(true)}>Editar</Button>
                                        <Button colorScheme="green" disabled={!editMode} onClick={() => {
                                            // Actualizar photoDetail y los estados globales
                                            setPhotoDetail(prev => prev ? {
                                                ...prev,
                                                location: editLocation,
                                                speedLimit: editSpeedLimit,
                                                measuredSpeed: editMeasuredSpeed
                                            } : prev);
                                            setDate(editDate);
                                            setTime(editTime);
                                            setEditMode(false);
                                        }}>Guardar</Button>
                                    </Box>
                                    </Box>
                                </Box>
                                {photoDetail.consultaVehiculo ? (
                                    <Box p={2} borderWidth={1} borderRadius={8} bg="#f8f9fa" color="black" maxWidth="1200px" minWidth="400px" mx="auto">
                                        <Text fontWeight='bold' fontSize="lg" mb={3} textAlign="center" color="#22543d">Resultado SAT</Text>
                                        <Box as="dl" display="grid" gridTemplateColumns="180px 1fr" alignItems="center" borderRadius={8} overflow="hidden">
                                            {[
                                                { label: 'Tipo', value: photoDetail.consultaVehiculo.TIPO },
                                                { label: 'Marca', value: photoDetail.consultaVehiculo.MARCA },
                                                { label: 'Línea', value: photoDetail.consultaVehiculo.LINEA },
                                                { label: 'Modelo', value: photoDetail.consultaVehiculo.MODELO },
                                                { label: 'Color', value: photoDetail.consultaVehiculo.COLOR },
                                                { label: 'Uso', value: photoDetail.consultaVehiculo.USO },
                                                { label: 'Placa', value: photoDetail.consultaVehiculo.PLACA },
                                                { label: 'CC', value: photoDetail.consultaVehiculo.CC },
                                            ].map((item, idx) => (
                                                <React.Fragment key={item.label}>
                                                    <Box as="dt" fontWeight="bold" textAlign="right" px={2} py={2} bg={idx % 2 === 0 ? '#38a169' : 'transparent'} color={idx % 2 === 0 ? 'white' : '#22543d'}>
                                                        {item.label}:
                                                    </Box>
                                                    <Box as="dd" px={2} py={2} bg={idx % 2 === 0 ? '#38a169' : 'transparent'} color={idx % 2 === 0 ? 'white' : '#22543d'}>
                                                        {item.value}
                                                    </Box>
                                                </React.Fragment>
                                            ))}
                                        </Box>
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