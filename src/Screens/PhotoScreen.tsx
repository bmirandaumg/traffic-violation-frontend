//Screen basic whit a list of photos
import React, { useEffect, useState } from 'react';
import { Box, Spinner, Text, Image, Button, CloseButton } from '@chakra-ui/react';

import { PhotosService, type PhotoDetail, type Vehicle } from '@/services/photos.service';
import { VehicleService } from '@/services/vehicle.service';
import { CruiseService, type Cruise } from '@/services/cruise.service';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plates } from '@/enums/plates.enum';

const PhotoScreen: React.FC = () => {
    // Estado para mostrar alerta de error de conexión
    const [showProcessError, setShowProcessError] = useState(false);
    const [processErrorMsg, setProcessErrorMsg] = useState('');
    const [photoDetail, setPhotoDetail] = useState<PhotoDetail>();

    const [loading, setLoading] = useState<boolean>(true);
    const [unblockError, setUnblockError] = useState<string | null>(null);

    // Estados originales para fecha y hora
    const [date, setDate] = useState<string>("");
    const [time, setTime] = useState<string>("");
    // Estados temporales para edición
    const [editDate, setEditDate] = useState(() => toInputDateFormat(date));
    const [editTime, setEditTime] = useState(time || '');
    const [editLocation, setEditLocation] = useState(photoDetail?.location || '');
    const [editSpeedLimit, setEditSpeedLimit] = useState(photoDetail?.speedLimit || '');
    const [editMeasuredSpeed, setEditMeasuredSpeed] = useState(photoDetail?.measuredSpeed || '');

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
                // Reset del flag de búsqueda manual al cambiar foto
                setHasManualSearch(false);
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

    // Sincronizar estados temporales cuando cambia photoDetail
    useEffect(() => {
        if (photoDetail) {
            setEditDate(toInputDateFormat(date));
            setEditTime(getUTCTimeWithSecondsFromISO(photoDetail.timestamp));
            setEditLocation(photoDetail.location || '');
            setEditSpeedLimit(photoDetail.speedLimit || '');
            setEditMeasuredSpeed(photoDetail.measuredSpeed || '');
        }
    }, [photoDetail, date]);

    // Estado para consulta SAT
    const [satPlaca, setSatPlaca] = useState("");
    const [satTipo, setSatTipo] = useState("");
    const [satVehicle, setSatVehicle] = useState<Vehicle | null>(null);
    const [satError, setSatError] = useState<string>("");
    const [showSatError, setShowSatError] = useState<boolean>(true);
    const [hasManualSearch, setHasManualSearch] = useState<boolean>(false);
    const [satLoading, setSatLoading] = useState<boolean>(false);

    // Estados para zoom de imagen (nuevos - no afectan funcionalidad existente)
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{x: number, y: number}>({x: 0, y: 0});
    const [imagePosition, setImagePosition] = useState<{x: number, y: number}>({x: 0, y: 0});
    const [imageContainerRef, setImageContainerRef] = useState<HTMLDivElement | null>(null);

    const handleSatSearch = async () => {
        // Validar que ambos campos estén completados
        if (!satTipo || !satPlaca) {
            setSatError("Por favor complete el tipo de placa y el número de placa antes de buscar.");
            return;
        }
        
        setSatError("");
        setSatVehicle(null);
        setSatLoading(true);
        setHasManualSearch(true);
        try {
            const vehicle = await VehicleService.consultarVehiculo(satPlaca, satTipo);
            if (vehicle && vehicle.PLACA) {
                setSatVehicle(vehicle);
                // Ocultar el mensaje de error automático cuando encontramos un vehículo manualmente
                setShowSatError(false);
            } else {
                setSatError("No se encontró información para los datos ingresados.");
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setSatError(error.response?.data?.message || "Error consultando el servicio SAT.");
            } else {
                setSatError("Error consultando el servicio SAT.");
            }
        } finally {
            setSatLoading(false);
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
        // No mostrar loading para operaciones que navegan inmediatamente
        try {
            await PhotosService.deletePhoto(id);
            navigate("/photos");
        } catch (error) {
            console.error("Error deleting photo:", error);
            // Solo mostrar loading si hay error y nos quedamos en la pantalla
        }
    };

    const plateOptions = Object.values(Plates).map(value => ({
        label: value,
        value: value
    }));

    const handleUnblockAndReturn = async () => {
        // No mostrar loading para operaciones que navegan inmediatamente
        setUnblockError(null);
        try {
            await PhotosService.unBlockPhoto(photoDetail!.id);
            // Al regresar, mantenemos los filtros para que el usuario continúe donde estaba
            navigate("/photos");
        } catch (error) {
            console.error("Ocurrió un error al liberar la foto", error);
            setUnblockError("Error al liberar la foto");
            // Solo mostrar error, no loading
        }
    };

    const processPhoto = async () => {
        // Validación 1: Datos básicos necesarios
        if (!photoDetail || !photo) {
            setProcessErrorMsg('Error: No se encontró información de la foto.');
            setShowProcessError(true);
            return;
        }
        
        // Validación 2: Campos del formulario completados
        if (!editLocation || !editDate || !editTime || !editSpeedLimit || !editMeasuredSpeed) {
            setProcessErrorMsg('Por favor complete todos los campos antes de procesar.');
            setShowProcessError(true);
            return;
        }
        
        // Validación 3: Información SAT (automática O manual)
        const hasSatInfo = photoDetail?.consultaVehiculo || satVehicle;
        if (!hasSatInfo) {
            setProcessErrorMsg('Se requiere información del vehículo SAT. Realice una búsqueda manual');
            setShowProcessError(true);
            return;
        }
        
        setLoading(true);
        try {
            // Usar los valores editados y la información SAT correspondiente
            // Si hay consulta manual, usar las partes separadas (satTipo + satPlaca)
            // Si es automática, usar las partes que ya vienen separadas
            const plateInfo = satVehicle ? {
                lpNumber: satPlaca || "",               // Solo el número que escribió el usuario
                lpType: satTipo || ""                   // Solo el tipo que seleccionó el usuario
            } : {
                lpNumber: photoDetail.plate_parts?.lpNumber || "",  // Número separado automáticamente
                lpType: photoDetail.plate_parts?.lpType || ""       // Tipo separado automáticamente
            };

            const params = {
                cruise: editLocation,
                timestamp: getDateTimeFromForm(editDate, editTime),
                speed_limit_kmh: Number(editSpeedLimit),
                current_speed_kmh: Number(editMeasuredSpeed),
                lpNumber: plateInfo.lpNumber,
                lpType: plateInfo.lpType,
                photoId: photoDetail.id,
                userId: Number(localStorage.getItem("userId")) 
            };
            
            console.log('📤 Enviando parámetros actualizados:', params);
            console.log('🔍 Fuente de info SAT:', satVehicle ? 'Manual' : 'Automática');
            const data = await PhotosService.processPhoto(params);
            console.log(data);
            if (data.photoProcessed) {
                // Al procesar exitosamente, navegar directamente sin quitar loading
                // (evita parpadeo de spinner → contenido → nueva pantalla)
                navigate("/photos");
            } else {
                setProcessErrorMsg('No se pudo procesar la foto. Intenta nuevamente.');
                setShowProcessError(true);
                setLoading(false);
            }
        } catch (error) {
            console.error("Error processing photo:", error);
            setProcessErrorMsg('No hay conexión con el servicio o ocurrió un error.');
            setShowProcessError(true);
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

    // Effect para manejar eventos de scroll de manera agresiva
    useEffect(() => {
        if (!imageContainerRef) return;

        const handleWheelAgressive = (e: WheelEvent) => {
            // Bloqueo completo y agresivo del scroll
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newZoom = Math.max(0.5, Math.min(3, zoomLevel + delta));
            setZoomLevel(newZoom);
            
            // Reset position si volvemos a zoom normal
            if (newZoom === 1) {
                setImagePosition({x: 0, y: 0});
            }
            
            return false;
        };

        // Añadir listener con capture=true para interceptar antes que cualquier otro elemento
        imageContainerRef.addEventListener('wheel', handleWheelAgressive, { 
            passive: false, 
            capture: true 
        });

        // Cleanup
        return () => {
            if (imageContainerRef) {
                imageContainerRef.removeEventListener('wheel', handleWheelAgressive, { capture: true });
            }
        };
    }, [imageContainerRef, zoomLevel, setZoomLevel, setImagePosition]);

    // Funciones para manejo de zoom (nuevas - no afectan funcionalidad existente)
    const handleWheel = (e: React.WheelEvent) => {
        // Backup handler - el agresivo debería manejar todo
        e.preventDefault();
        e.stopPropagation();
        
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.5, Math.min(3, zoomLevel + delta));
        setZoomLevel(newZoom);
        
        // Reset position si volvemos a zoom normal
        if (newZoom === 1) {
            setImagePosition({x: 0, y: 0});
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomLevel > 1) {
            setIsDragging(true);
            setDragStart({ 
                x: e.clientX - imagePosition.x, 
                y: e.clientY - imagePosition.y 
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoomLevel > 1) {
            setImagePosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const resetZoom = () => {
        setZoomLevel(1);
        setImagePosition({x: 0, y: 0});
        setIsDragging(false);
    };

    return (
        <Box p={4} backgroundColor="white" minH="100vh" color="black">
            <Text fontSize="2xl" mb={4} fontWeight="bold">
                Foto
            </Text>
            {loading ? (
                <Spinner size="xl" />
            ) : (
                <Box 
                    color="black" 
                    display="grid" 
                    gridTemplateColumns={{ base: '1fr', lg: '1fr 1fr 1fr' }} 
                    gap={4}
                    minHeight="calc(100vh - 120px)"
                >
                    {/* Columna 1: Foto y botones */}
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="flex-start">
                        {photo_base64 && (
                            <Box width="100%" mb={3}>
                                {/* Contenedor con zoom */}
                                <Box 
                                    ref={setImageContainerRef}
                                    position="relative"
                                    overflow="hidden"
                                    cursor={zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in"}
                                    onWheel={handleWheel}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                    width="100%"
                                    maxHeight="400px"
                                    borderRadius={8}
                                    border="2px solid transparent"
                                    style={{
                                        // Bloqueo agresivo de scroll y touch
                                        touchAction: 'none',
                                        overscrollBehavior: 'contain',
                                        scrollbarWidth: 'none',
                                        msOverflowStyle: 'none'
                                    }}
                                    _hover={{
                                        borderColor: zoomLevel > 1 ? "#3182ce" : "#e2e8f0"
                                    }}
                                >
                                    <Image
                                        src={`data:image/png;base64,${photo_base64}`}
                                        alt="Foto"
                                        maxWidth="550px"
                                        maxHeight="400px"
                                        width="100%"
                                        height="auto"
                                        objectFit="contain"
                                        borderRadius={8}
                                        boxShadow="md"
                                        transform={`scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`}
                                        transformOrigin="center"
                                        transition="transform 0.1s ease-out"
                                        userSelect="none"
                                        draggable={false}
                                    />
                                </Box>
                                
                                {/* Indicadores de zoom */}
                                {zoomLevel !== 1 && (
                                    <Box textAlign="center" mt={2}>
                                        <Text fontSize="xs" color="gray.600">
                                            Zoom: {Math.round(zoomLevel * 100)}% | Scroll: ±Zoom | 
                                            {zoomLevel > 1 ? " Arrastra: Mover |" : ""} 
                                            <Text 
                                                as="span" 
                                                color="blue.500" 
                                                cursor="pointer" 
                                                onClick={resetZoom}
                                                _hover={{ textDecoration: "underline" }}
                                            >
                                                Reset
                                            </Text>
                                        </Text>
                                    </Box>
                                )}
                            </Box>
                        )}
                        <Box width="100%" display="flex" flexDirection="column" gap={2} mt={2} alignItems="stretch">
                            <Button 
                                color="white" 
                                variant='outline' 
                                _hover={{ bg: '#15803D' }} 
                                bg='#16A34A' 
                                onClick={processPhoto} 
                                size="sm"
                                fontWeight="bold"
                            >
                                Procesar
                            </Button>

                            <Button 
                                color="white"
                                variant='outline' 
                                onClick={() => handleDeletePhoto(photoDetail!.id)}
                                _hover={{ bg: '#c82333' }} 
                                bg='#dc3545'
                                size="sm"
                                fontWeight="bold"
                            >
                                Descartar
                            </Button>
                            <Button 
                                color="white"
                                variant="outline"
                                bg="#FBBF24"
                                _hover={{ bg: "#F59E0B" }}
                                onClick={handleUnblockAndReturn}
                                size="sm"
                                fontWeight="bold"
                            >
                                Regresar
                            </Button>
                        </Box>
                        {/* Mensaje de error del procesamiento */}
                        {showProcessError && (
                            <Box 
                                background="#fff5f5" 
                                border="1px solid #feb2b2" 
                                color="#c53030" 
                                borderRadius={8} 
                                mt={3} 
                                p={3} 
                                position="relative"
                                fontSize="sm"
                            >
                                <Box fontWeight="bold" mb={1}>Error de procesamiento</Box>
                                <Box>{processErrorMsg}</Box>
                                <CloseButton position="absolute" right="8px" top="8px" size="sm" onClick={() => setShowProcessError(false)} />
                            </Box>
                        )}
                        {unblockError && (
                            <Text color="red.500" mt={2} textAlign="center" fontSize="sm">
                                {unblockError}
                            </Text>
                        )}
                    </Box>

                    {/* Columna 2: Información del Vehículo */}
                   <Box display="flex" flexDirection="column" justifyContent="flex-start">
                        {photoDetail && (
                            <Box p={3} borderWidth={1} borderRadius={8} bg="#f8f9fa" color="black" width="100%">
                                <Text fontWeight="bold" fontSize="md" mb={3} textAlign="center">Información del Vehículo</Text>
                                <Box as="form" display="grid" gridTemplateColumns="120px 1fr" rowGap={2} columnGap={2} alignItems="center">
                                    <label htmlFor="fecha-input" style={{ fontWeight: 'bold', textAlign: 'right', fontSize: '14px' }}>Fecha:</label>
                                    <input
                                        type="date"
                                        value={editDate}
                                        onChange={e => setEditDate(e.target.value)}
                                        style={{ flex: 1, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4, padding: '4px 8px', fontSize: 14 }}
                                    />
                                    <label htmlFor="hora-input" style={{ fontWeight: 'bold', textAlign: 'right', fontSize: '14px' }}>Hora:</label>
                                    <Box display="flex" flexDirection="column">
                                        <input
                                            id="hora-input"
                                            type="time"
                                            step="1"
                                            value={editTime}
                                            onChange={e => setEditTime(e.target.value)}
                                            style={{ flex: 1, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4, padding: '4px 8px', fontSize: 14 }}
                                        />
                                        {editTime && (
                                            <Text fontSize="xs" color="gray.600" mt={1}>
                                                Formato 24h: {normalizeTo24HourFormat(editTime)}
                                            </Text>
                                        )}
                                    </Box>
                                    <label htmlFor="ubicacion-input" style={{ fontWeight: 'bold', textAlign: 'right', fontSize: '14px' }}>Ubicación:</label>
                                    <select
                                        value={editLocation}
                                        onChange={e => setEditLocation(e.target.value)}
                                        style={{ flex: 1, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4, padding: '4px 8px', fontSize: 14 }}
                                    >
                                        <option value="">Seleccione un crucero</option>
                                        {cruises.map(c => (
                                          <option key={c.id} value={c.cruise_name}>{c.cruise_name}</option>
                                        ))}
                                    </select>
                                    <label htmlFor="limite-input" style={{ fontWeight: 'bold', textAlign: 'right', fontSize: '14px' }}>Límite de velocidad:</label>
                                    <input 
                                        id="limite-input"
                                        type="number"
                                        value={editSpeedLimit}
                                        onChange={e => setEditSpeedLimit(e.target.value)}
                                        style={{ width: '100%', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4, padding: '4px 8px', fontSize: 14 }}
                                    />
                                    <label htmlFor="medida-input" style={{ fontWeight: 'bold', textAlign: 'right', fontSize: '14px' }}>Velocidad medida:</label>
                                    <input
                                        id="medida-input"
                                        type="number"
                                        value={editMeasuredSpeed}
                                        onChange={e => setEditMeasuredSpeed(e.target.value)}
                                        style={{ width: '100%', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4, padding: '4px 8px', fontSize: 14 }}
                                    />
                                </Box>
                            </Box>
                        )}

                        {/* Sección de consulta SAT manual - Siempre visible */}
                        <Box mt={3} p={3} borderWidth={1} borderRadius={8} bg="#f0f8ff" width="100%">
                            <Text fontWeight="bold" fontSize="md" mb={2} textAlign="center">Consulta SAT Manual</Text>
                            <Box display="flex" flexDirection="column" gap={2}>
                                <select
                                    value={satTipo}
                                    onChange={e => setSatTipo(e.target.value)}
                                    style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#222', fontSize: 14 }}
                                >
                                    <option value="">Selecciona tipo</option>
                                    {plateOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    placeholder="Placa"
                                    value={satPlaca}
                                    onChange={e => setSatPlaca(e.target.value.toUpperCase())}
                                    style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#222', fontSize: 14 }}
                                />
                                <Button 
                                    color="white" 
                                    variant='outline' 
                                    _hover={{ bg: '#1184f7ff' }} 
                                    bg='#1173d5ff' 
                                    onClick={handleSatSearch}
                                    size="sm"
                                    width="100%"
                                    disabled={satLoading}
                                >
                                    {satLoading ? (
                                        <>
                                            <Spinner size="xs" mr={2} />
                                            Consultando...
                                        </>
                                    ) : (
                                        "Buscar en SAT"
                                    )}
                                </Button>
                            </Box>
                            {satError && (
                                 <Text color="red.500" mt={2} textAlign="center" fontSize="sm">
                                    {satError}
                                </Text>
                            )}
                        </Box>
                    </Box>

                    {/* Columna 3: Resultado SAT */}
                    <Box display="flex" flexDirection="column" justifyContent="flex-start">
                        {/* Resultado SAT automático - Solo se muestra si NO hay búsqueda manual iniciada */}
                        {photoDetail && photoDetail.consultaVehiculo && !satVehicle && !hasManualSearch && (
                            <Box p={3} borderWidth={1} borderRadius={8} bg="#f8f9fa" color="black" width="100%">
                                <Text fontWeight='bold' fontSize="md" mb={3} textAlign="center" color="#374151">Resultado SAT</Text>
                                <Box as="dl" display="grid" gridTemplateColumns="100px 1fr" alignItems="center" borderRadius={8} overflow="hidden" fontSize="sm">
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
                                            <Box as="dt" fontWeight="bold" textAlign="right" px={1} py={1} bg={idx % 2 === 0 ? '#e2e8f0' : '#fff'} color="#4a5568">
                                                {item.label}:
                                            </Box>
                                            <Box as="dd" px={1} py={1} bg={idx % 2 === 0 ? '#e2e8f0' : '#fff'} color="#000">
                                                {item.value}
                                            </Box>
                                        </React.Fragment>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Error cuando no se encuentra información SAT */}
                        {photoDetail && photoDetail.isSatVehicleInfoFound === false && showSatError && !satVehicle && (
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
                                width="100%"
                            >
                                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#feb2b2"/><path d="M12 7v5" stroke="#c53030" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="16" r="1" fill="#c53030"/></svg>
                                <Text color="#c53030" fontWeight="bold" fontSize="sm">No se encontró información SAT del vehículo.</Text>
                            </Box>
                        )}

                        {/* Resultado de consulta SAT manual */}
                        {satVehicle && (
                            <Box mt={2} p={3} borderWidth={1} borderRadius={8} bg="#f8f9fa" color="black" width="100%">
                                <Text fontWeight='bold' fontSize="md" mb={3} textAlign="center" color="#374151">Resultado SAT Manual</Text>
                                <Box as="dl" display="grid" gridTemplateColumns="100px 1fr" alignItems="center" borderRadius={8} overflow="hidden" fontSize="sm">
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
                                            <Box as="dt" fontWeight="bold" textAlign="right" px={1} py={1} bg={idx % 2 === 0 ? '#e2e8f0' : '#fff'} color="#4a5568">
                                                {item.label}:
                                            </Box>
                                            <Box as="dd" px={1} py={1} bg={idx % 2 === 0 ? '#e2e8f0' : '#fff'} color="#000">
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
};

export default PhotoScreen;
