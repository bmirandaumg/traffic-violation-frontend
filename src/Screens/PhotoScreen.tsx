//Screen basic whit a list of photos
import React, { useEffect, useState } from 'react';
import { Box, Spinner, Text, Image, Button, CloseButton } from '@chakra-ui/react';

import { PhotosService, type PhotoDetail, type Vehicle } from '@/services/photos.service';
import { VehicleService } from '@/services/vehicle.service';
import { CruiseService, type Cruise } from '@/services/cruise.service';
import { useLocation, useNavigate } from 'react-router-dom';

const PhotoScreen: React.FC = () => {
    // Estado para mostrar alerta de error de conexión
    const [showProcessError, setShowProcessError] = useState(false);
    const [processErrorMsg, setProcessErrorMsg] = useState('');
    const [photoDetail, setPhotoDetail] = useState<PhotoDetail>();
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);
    // Estado para habilitar/deshabilitar el botón Procesar en modo SAT
    const [canProcessSat, setCanProcessSat] = useState(false);
    // Estados originales para fecha y hora
    const [date, setDate] = useState<string>("");
    const [time, setTime] = useState<string>("");
    // Estados temporales para edición
    const [editDate, setEditDate] = useState(() => toInputDateFormat(date));
    const [editTime, setEditTime] = useState(time || '');
    const [editLocation, setEditLocation] = useState(photoDetail?.location || '');
    const [editSpeedLimit, setEditSpeedLimit] = useState(photoDetail?.speedLimit || '');
    const [editMeasuredSpeed, setEditMeasuredSpeed] = useState(photoDetail?.measuredSpeed || '');
    const [showValidation, setShowValidation] = useState(false);
    const location = useLocation();
    const { photo } = location.state || {};
    const { photo_base64 } = photo || {};
    const navigate = useNavigate();

    const [cruises, setCruises] = useState<Cruise[]>([]);

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
                    setTime(getUTCTimeWithSecondsFromISO(detail.timestamp));
                }
            } catch (error) {
                console.error("Error al obtener el detalle de la foto:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPhotoDetail();
    }, [photo]);

    // Cargar cruceros al montar el componente
    useEffect(() => {
      const fetchCruises = async () => {
        try {
          const data = await CruiseService.get();
          setCruises(data);
        } catch (error) {
          console.error('Error cargando cruceros:', error);
        }
      };
      fetchCruises();
    }, []);

    // Sincronizar estados temporales al entrar en modo edición
    useEffect(() => {
        if (editMode && photoDetail) {
            setEditDate(toInputDateFormat(date));
            setEditTime(getUTCTimeWithSecondsFromISO(photoDetail.timestamp));
            setEditLocation(photoDetail.location || '');
            setEditSpeedLimit(photoDetail.speedLimit || '');
            setEditMeasuredSpeed(photoDetail.measuredSpeed || '');
        }
    }, [editMode, photoDetail, date]);

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
    setCanProcessSat(false); // Deshabilitar procesar hasta que la consulta sea exitosa
        try {
            const vehicle = await VehicleService.consultarVehiculo(satPlaca, satTipo);
            if (vehicle && vehicle.PLACA) {
                setSatVehicle(vehicle);
                setCanProcessSat(true); // Habilitar procesar si la consulta fue exitosa
            } else {
                setSatError("No se encontró información para los datos ingresados.");
                setCanProcessSat(false);
            }
        } catch (error) {
            setSatError("Error consultando el servicio SAT.");
            setCanProcessSat(false);
        }
    };

    function getDateTimeFromForm(dateStr: string, timeStr: string): Date {
        // Acepta dateStr en formatos dd/mm/yyyy ó yyyy-mm-dd y timeStr en HH:mm[:ss]
        if (!dateStr || !timeStr) return new Date();

        let day: string, month: string, year: string;
        if (dateStr.includes('/')) { // dd/mm/yyyy
            const parts = dateStr.split('/');
            if (parts.length !== 3) return new Date();
            [day, month, year] = parts;
        } else if (dateStr.includes('-')) { // yyyy-mm-dd
            const parts = dateStr.split('-');
            if (parts.length !== 3) return new Date();
            [year, month, day] = parts;
        } else {
            return new Date();
        }

        const timeParts = timeStr.split(':');
        if (timeParts.length < 2) return new Date();
        const [hours, minutes, seconds = '00'] = timeParts;

        return new Date(Date.UTC(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hours),
            Number(minutes),
            Number(seconds)
        ));
    }

    const handleDeletePhoto = async (id: number) => {
        if (!photoDetail || !photoDetail.id) return;
        setLoading(true);
        try {
            await PhotosService.deletePhoto(id);
            navigate("/photos");
        } catch (error) {
            console.error("Error deleting photo:", error);
        } finally {
            setLoading(false);
        }
    };

    const processPhoto = async () => {
        if (!photoDetail || !photoDetail.consultaVehiculo || !photo) return;
        setLoading(true);
        try {
            const params = {
                cruise: photoDetail.location || "",
                timestamp: getDateTimeFromForm(date, time),
                speed_limit_kmh: Number(photoDetail.speedLimit) || 0,
                current_speed_kmh: Number(photoDetail.measuredSpeed) || 0,
                lpNumber: photoDetail.plate_parts?.lpNumber || "",
                lpType: photoDetail.plate_parts?.lpType || "",
                photoId: photoDetail.id
            };
            const data = await PhotosService.processPhoto(params);
            console.log(data);
            if (data.status === "processed") {
                navigate("/photos");
            } else {
                setProcessErrorMsg('No se pudo procesar la foto. Intenta nuevamente.');
                setShowProcessError(true);
            }
        } catch (error) {
            console.error("Error processing photo:", error);
            setProcessErrorMsg('No hay conexión con el servicio o ocurrió un error.');
            setShowProcessError(true);
        } finally {
            setLoading(false);
        }
    };

    // Utilidad para convertir dd/mm/yyyy a yyyy-mm-dd
    function toInputDateFormat(dateStr: string) {
        if (!dateStr) return '';
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return dateStr;
    }
    // Utilidad para convertir yyyy-mm-dd a dd/mm/yyyy
    function toDisplayDateFormat(dateStr: string) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    }
    // Utilidad para extraer hora UTC en formato HH:mm:ss
    function getUTCTimeWithSecondsFromISO(isoStr: string) {
      if (!isoStr) return '';
      const date = new Date(isoStr);
      const hh = String(date.getUTCHours()).padStart(2, '0');
      const mm = String(date.getUTCMinutes()).padStart(2, '0');
      const ss = String(date.getUTCSeconds()).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }

    // Utilidad para mostrar la hora bajo el input siempre en 24h
    function normalizeTo24HourFormat(timeStr: string) {
      const trimmed = timeStr.trim();
      if (!trimmed) return '';

      const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
      if (!match) {
        return trimmed;
      }

      let hour = parseInt(match[1] ?? '0', 10);
      const minutes = match[2] ?? '00';
      const seconds = match[3] ?? '00';
      const period = match[4]?.toLowerCase();

      if (period === 'pm' && hour < 12) {
        hour += 12;
      } else if (period === 'am' && hour === 12) {
        hour = 0;
      }

      const normalizedHour = String(hour).padStart(2, '0');
      return `${normalizedHour}:${minutes}:${seconds}`;
    }

    return (
        <Box p={4} backgroundColor="white" minH="100vh" color="black">
            <Text fontSize="2xl" mb={4} fontWeight="bold">
                Foto
            </Text>
            {showProcessError && (
                <Box 
                    background="#fff5f5" 
                    border="1px solid #feb2b2" 
                    color="#c53030" 
                    borderRadius={8} 
                    mb={4} 
                    p={4} 
                    position="relative"
                    display="flex"
                    alignItems="center"
                >
                    <Box fontWeight="bold" fontSize="lg" mr={2}>Error de conexión</Box>
                    <Box flex="1">{processErrorMsg}</Box>
                    <CloseButton position="absolute" right="8px" top="8px" onClick={() => setShowProcessError(false)} />
                </Box>
            )}
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
                            <Button 
                                color="white" 
                                variant='outline' 
                                _hover={{ bg: '#4cae4f' }} 
                                bg='#5cb85c' 
                                onClick={processPhoto} 
                                disabled={editMode || (showSatInputs ? !canProcessSat : false)}
                            >
                                Procesar
                            </Button>
                            <Button 
                                color="white" 
                                variant='outline' 
                                bg='#007bff' 
                                _hover={{ bg: '#0056b3' }}
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
                                disabled={editMode || showSatInputs}
                            >
                                Realizar Consulta en Sat
                            </Button>
                            <Button 
                            color="white"
                            variant='outline' 
                            onClick={() => handleDeletePhoto(photoDetail!.id)}
                            _hover={{ bg: '#c82333' }} 
                            bg='#dc3545' 
                            disabled={editMode}>
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
                                                type="date"
                                                value={editDate}
                                                onChange={e => setEditDate(e.target.value)}
                                                style={{ flex: 1, background: '#fff', border: showValidation && !editDate ? '2px solid #e53e3e' : '1px solid #cbd5e1', borderRadius: 6, padding: '2px 12px', fontSize: 16 }}
                                            />
                                        ) : (
                                            <input
                                                value={date || ''}
                                                disabled
                                                style={{ flex: 1, background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: 6, padding: '2px 12px', fontSize: 16 }}
                                            />
                                        )}
                                        <label htmlFor="hora-input" style={{ fontWeight: 'bold', textAlign: 'right' }}>Hora:</label>
                                        {editMode ? (
                                            <Box display="flex" flexDirection="column">
                                                <input
                                                    id="hora-input"
                                                    type="time"
                                                    step="1"
                                                    value={editTime}
                                                    onChange={e => setEditTime(e.target.value)}
                                                    style={{ flex: 1, background: '#fff', border: showValidation && !editTime ? '2px solid #e53e3e' : '1px solid #cbd5e1', borderRadius: 6, padding: '2px 12px', fontSize: 16 }}
                                                />
                                                {editTime && (
                                                    <Text fontSize="sm" color="gray.600" mt={1}>
                                                        Formato 24h: {normalizeTo24HourFormat(editTime)}
                                                    </Text>
                                                )}
                                            </Box>
                                        ) : (
                                            <Box display="flex" flexDirection="column">
                                                <input
                                                    id="hora-input"
                                                    value={time}
                                                    disabled
                                                    style={{ flex: 1, background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: 6, padding: '2px 12px', fontSize: 16 }}
                                                />
                                                {time && (
                                                    <Text fontSize="sm" color="gray.600" mt={1}>
                                                        Formato 24h: {normalizeTo24HourFormat(time)}
                                                    </Text>
                                                )}
                                            </Box>
                                        )}
                                        <label htmlFor="ubicacion-input" style={{ fontWeight: 'bold', textAlign: 'right' }}>Ubicación:</label>
                                        {editMode ? (
                                            <select
                                                value={editLocation}
                                                onChange={e => setEditLocation(e.target.value)}
                                                style={{ flex: 1, background: '#fff', border: showValidation && !editLocation ? '2px solid #e53e3e' : '1px solid #cbd5e1', borderRadius: 6, padding: '2px 12px', fontSize: 16 }}
                                            >
                                                <option value="">Seleccione un crucero</option>
                                                {cruises.map(c => (
                                                  <option key={c.id} value={c.cruise_name}>{c.cruise_name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                value={photoDetail?.location || ''}
                                                disabled
                                                style={{ flex: 1, background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: 6, padding: '2px 12px', fontSize: 16 }}
                                            />
                                        )}
                                        <label htmlFor="limite-input" style={{ fontWeight: 'bold', textAlign: 'right' }}>Límite de velocidad:</label>
                                        {editMode ? (
                                            <input 
                                                id="limite-input"
                                                type="number"
                                                value={editSpeedLimit}
                                                onChange={e => setEditSpeedLimit(e.target.value)}
                                                style={{ width: '100%', background: '#fff', border: showValidation && !editSpeedLimit ? '2px solid #e53e3e' : '1px solid #cbd5e1', borderRadius: 4, padding: '2px 8px' }}
                                            />
                                        ) : (
                                            <input
                                                id="limite-input"
                                                value={photoDetail.speedLimit ?? ''}
                                                disabled
                                                style={{ width: '100%', background: '#e2e8f0', border: 'none', borderRadius: 4, padding: '2px 8px' }}
                                            />
                                        )}
                                        <label htmlFor="medida-input" style={{ fontWeight: 'bold', textAlign: 'right' }}>Velocidad medida:</label>
                                        {editMode ? (
                                            <input
                                                id="medida-input"
                                                type="number"
                                                value={editMeasuredSpeed}
                                                onChange={e => setEditMeasuredSpeed(e.target.value)}
                                                style={{ width: '100%', background: '#fff', border: showValidation && !editMeasuredSpeed ? '2px solid #e53e3e' : '1px solid #cbd5e1', borderRadius: 4, padding: '2px 8px' }}
                                            />
                                        ) : (
                                            <input
                                                id="medida-input"
                                                value={photoDetail.measuredSpeed ?? ''}
                                                disabled
                                                style={{ width: '100%', background: '#e2e8f0', border: 'none', borderRadius: 4, padding: '2px 8px' }}
                                            />
                                        )}

                                    {/* Botones Editar y Guardar */}
                                    <Box gridColumn="1 / span 2" display="flex" justifyContent="center" gap={4} mt={4}>
                                        <Button 
                                            colorScheme="blue"
                                            bg="#007bff"
                                            color="white"
                                            _hover={{ bg: "#0056b3" }}
                                            disabled={!photoDetail || editMode}
                                            onClick={() => setEditMode(true)}
                                        >Editar</Button>
                                        <Button 
                                            colorScheme="green" 
                                            bg="#38a169" 
                                            _hover={{ bg: "#2f8b5b" }}
                                            color="white" 
                                            disabled={!editMode} 
                                            onClick={() => {
                                                if (!editDate || !editTime || !editLocation || !editSpeedLimit || !editMeasuredSpeed) {
                                                    setShowValidation(true);
                                                    return;
                                                }
                                                const isoTimestamp = getDateTimeFromForm(editDate, editTime).toISOString();
                                                // Actualizar photoDetail y los estados globales (incluyendo timestamp)
                                                setPhotoDetail(prev => prev ? {
                                                    ...prev,
                                                    timestamp: isoTimestamp,
                                                    location: editLocation,
                                                    speedLimit: editSpeedLimit,
                                                    measuredSpeed: editMeasuredSpeed
                                                } : prev);
                                                setDate(toDisplayDateFormat(editDate)); // Guardamos formato dd/mm/yyyy
                                                setTime(editTime); // Guardamos la hora HH:mm:ss
                                                setEditMode(false);
                                                setShowValidation(false);
                                            }}
                                        >Guardar</Button>
                                    </Box>
                                    </Box>
                                </Box>
                                {/* Mostrar el recuadro verde solo si no está activa la consulta manual */}
                                {photoDetail.consultaVehiculo && !showSatInputs ? (
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
                                                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#222' }}
                                            />
                                            <input
                                                placeholder="Tipo"
                                                value={satTipo}
                                                onChange={e => setSatTipo(e.target.value)}
                                                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#222' }}
                                            />
                                            <Button color="white" variant='outline' _hover={{ bg: '#2f855a' }} bg='#38a169' onClick={handleSatSearch}>
                                                Buscar
                                            </Button>
                                        </Box>
                                        {satError && (
                                            <Text color="red.500" mt={2} textAlign="center">
                                                {satError}
                                            </Text>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                        {satVehicle && (
                            <Box mt={2} p={2} borderWidth={1} borderRadius={8} bg="#f8f9fa" color="black" maxWidth="1200px" minWidth="400px" mx="auto">
                                <Text fontWeight='bold' fontSize="lg" mb={3} textAlign="center" color="#22543d">Resultado SAT</Text>
                                <Box as="dl" display="grid" gridTemplateColumns="180px 1fr" alignItems="center" borderRadius={8} overflow="hidden">
                                    {[ 
                                        { label: 'Estado', value: satVehicle.ESTADO },
                                        { label: 'Placa', value: satVehicle.PLACA },
                                        { label: 'Marca', value: satVehicle.MARCA },
                                        { label: 'Línea', value: satVehicle.LINEA },
                                        { label: 'Modelo', value: satVehicle.MODELO },
                                        { label: 'Color', value: satVehicle.COLOR },
                                        { label: 'Tipo', value: satVehicle.TIPO },
                                        { label: 'Uso', value: satVehicle.USO },
                                        { label: 'CC', value: satVehicle.CC },
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
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    );
}
export default PhotoScreen;
