//Screen basic whit a list of photos
import React, { useEffect, useState } from 'react';
import { Box, Grid, Image, Spinner, Text, Button } from '@chakra-ui/react';
import { CruiseService, type Cruise } from '@/services/cruise.service';
import { PhotosService, type Photo } from '@/services/photos.service';
import { useNavigate } from "react-router-dom";

// Función para validar que la fecha esté completa
const isValidCompleteDate = (dateString: string): boolean => {
    if (!dateString) return false;
    
    // Formato YYYY-MM-DD (input type="date")
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (isoDateRegex.test(dateString)) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        // Validar que sea una fecha válida Y que el año sea realista (entre 1900 y 2100)
        return !isNaN(date.getTime()) && year >= 1900 && year <= 2100;
    }
    
    // Formato DD/MM/YYYY
    const ddmmyyyyRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (ddmmyyyyRegex.test(dateString)) {
        const [day, month, year] = dateString.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        // Validar que sea una fecha válida Y que el año sea realista
        return !isNaN(date.getTime()) && 
               date.getDate() === day && 
               date.getMonth() === month - 1 && 
               date.getFullYear() === year &&
               year >= 1900 && year <= 2100;
    }
    
    return false;
};

const PhotosScreen: React.FC = () => {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [page, setPage] = useState<number>(() => {
    const savedPage = localStorage.getItem('photos_current_page');
    return savedPage ? parseInt(savedPage) : 1;
    });
    const [cruises, setCruises] = useState<Cruise[]>([]);
    const [selectedCruise, setSelectedCruise] = useState<string>("");
    const [date, setDate] = useState<string>("");

    const limitPhotosPerPage = 10;
    // Inicializar con loading: false si hay datos en localStorage (evita parpadeo)

    const [loading, setLoading] = useState<boolean>(() => {
        const savedCruise = localStorage.getItem('photos_filter_cruise');
        const savedDate = localStorage.getItem('photos_filter_date');
        // Solo loading si NO hay datos guardados
        return !(savedCruise && savedDate && isValidCompleteDate(savedDate));
    });
    const [hasAutoSearched, setHasAutoSearched] = useState<boolean>(false);
    const [returningFromDetail, setReturningFromDetail] = useState<boolean>(() => localStorage.getItem('photos_returning_from_detail') === "1");
    const [isPaginating, setIsPaginating] = useState<boolean>(false);
    const [noPhotosMessage, setNoPhotosMessage] = useState<string>("");
    const navigate = useNavigate();

    const fetchPhotos = async (cruise_id: number, date: string, page: number, showLoading: boolean = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            setNoPhotosMessage(""); // Limpiar mensaje anterior
            
            const data = await PhotosService.getAll(cruise_id, date, page);
            
            if(Array.isArray(data.photos) && data.photos.length === 0 && page > 1) {

                setPage(page - 1);
                localStorage.setItem('photos_current_page', (page - 1).toString());
                return;
            }

            // data.photos: array de fotos, data.total: total de fotos
            setPhotos(data.photos);
            setTotal(data.total);
            if (Array.isArray(data.photos) && data.photos.length === 0) {
                setNoPhotosMessage(`No se encontraron fotos para la fecha ${date} en el crucero seleccionado`);
            } else {
                setNoPhotosMessage("");
            }
            // Guardar filtros en localStorage para persistencia
            localStorage.setItem('photos_filter_cruise', cruise_id.toString());
            localStorage.setItem('photos_filter_date', date);
        } catch (error) {
            console.error("Error fetching photos:", error);
        } finally {
            setLoading(false);
        }
    }


    const fetchCruises = async () => {
        try {
            setLoading(true);
            const cruisesData = await CruiseService.get();
            setCruises(cruisesData);
        } catch (error) {
            console.error("Error fetching cruises:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCruises();
    }, []);

    useEffect(() => {
        localStorage.removeItem('photos_returning_from_detail');
    }, []);

    // Restaurar filtros desde localStorage al cargar la pantalla
    useEffect(() => {
        const savedCruise = localStorage.getItem('photos_filter_cruise');
        const savedDate = localStorage.getItem('photos_filter_date');
        
        if (savedCruise) {
            setSelectedCruise(savedCruise);
        }
        if (savedDate) {
            setDate(savedDate);
        }
    }, []);

    // Búsqueda automática cuando se restauran los filtros y ya están los cruceros cargados (solo una vez)
    useEffect(() => {
        if (
            returningFromDetail &&
            selectedCruise &&
            date &&
            cruises.length > 0 &&
            !hasAutoSearched &&
            isValidCompleteDate(date)
        ) {
            setReturningFromDetail(false);
            setHasAutoSearched(true);
            // Usar setTimeout para evitar conflictos con el loading state
            // showLoading: false para evitar parpadeo en la auto-búsqueda
            setTimeout(() => {
                fetchPhotos(parseInt(selectedCruise), date, page, false);
            }, 100);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCruise, date, cruises, hasAutoSearched, returningFromDetail]);

    // Recargar fotos al cambiar de página
    useEffect(() => {
        if (selectedCruise && date && isValidCompleteDate(date)) {
            if (isPaginating) {
                fetchPhotos(parseInt(selectedCruise), date, page);
            } else {
                localStorage.setItem('photos_current_page', '1');
            }
        }
        // eslint-disable-next-line
    }, [page, isPaginating]);


    const onPressPhoto = async (photo: Photo) => {
        try {
        await PhotosService.blockPhoto(photo.id);
        localStorage.setItem('photos_returning_from_detail', "1");
        navigate("/photo" , { state: { photo } });
        } catch (error) {
            console.error("Error bloqueando la foto:", error);
            // Puedes mostrar un mensaje de error si lo deseas
        }
    }

    return (
        <Box p={4} backgroundColor="white" minH="100vh">
            <Text fontSize="2xl" mb={4} fontWeight="bold" color={"black"} justifyContent={"center"} textAlign="center">
                Fotos
            </Text>
            {loading ? (
                <Spinner size="xl" />
            ) : (
                <>
                    <Box display="flex" flexDirection="row"
                        alignItems="end"
                        justifyContent="center"
                        w="100%" gap="4"
                        flexWrap="wrap">
                        <Box>
                            <Text fontSize="sm" color={'black'} mb={1} fontWeight="medium">Crucero</Text>
                            {cruises.length > 0 ? (
                                <select 
                                    value={selectedCruise} 
                                    onChange={(e) => {
                                        setIsPaginating(false);
                                        setSelectedCruise(e.target.value);
                                        setHasAutoSearched(false);
                                        setReturningFromDetail(false);
                                    }}
                                    style={{
                                        width: "280px",
                                        height: "40px",
                                        padding: "8px 12px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        backgroundColor: "white",
                                        color: "black",
                                        outline: "none",
                                        cursor: "pointer"
                                    }}
                                >
                                    <option value="">Selecciona un crucero</option>
                                    {cruises.map((cruise) => (
                                        <option key={cruise.id} value={cruise.id}>
                                            {cruise.cruise_name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <Box width="280px" height="40px" bg="gray.100" borderRadius="md" display="flex" alignItems="center" px={3}>
                                    <Text color="gray.500" fontSize="sm">Cargando cruceros...</Text>
                                </Box>
                            )}
                        </Box>

                        <Box>
                            <Text fontSize="sm" color={'black'} mb={1} fontWeight="medium">Fecha</Text>
                            <input 
                                type="date" 
                                placeholder="Fecha"
                                value={date}
                                onChange={(e) => {
                                    setIsPaginating(false);
                                    setDate(e.target.value);
                                    setHasAutoSearched(false);
                                    setReturningFromDetail(false);
                                }}
                                style={{
                                    width: "180px",
                                    height: "40px",
                                    padding: "8px 12px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    backgroundColor: "white",
                                    color: "black",
                                    outline: "none",
                                    cursor: "pointer"
                                }}
                            />
                        </Box>

                        <Button 
                            alignSelf='flex-end' 
                            bg='#83D00D' 
                            color='white' 
                            _hover={{ bg: "#4cae4c" }}
                            onClick={() => {
                                if (selectedCruise && date) {
                                    setPage(1);
                                    localStorage.setItem('photos_current_page', '1');
                                    fetchPhotos(parseInt(selectedCruise), date, 1);
                                }
                            }}
                            disabled={!selectedCruise || !date}
                        >
                            Obtener fotos
                        </Button>


                    </Box>

                    {/* Mensaje cuando no hay fotos - SOLO cuando hay mensaje */}
                    {noPhotosMessage && (
                        <Box 
                            textAlign="center" 
                            py={8} 
                            mt={8}
                            borderWidth="2px" 
                            borderRadius="lg" 
                            borderColor="orange.200"
                            backgroundColor="orange.50"
                        >
                            <Text fontSize="lg" color="orange.600" fontWeight="medium">
                                📷 {noPhotosMessage}
                            </Text>
                            <Text fontSize="sm" color="gray.500" mt={2}>
                                Intenta con otra fecha o crucero
                            </Text>
                        </Box>
                    )}

                    {photos && <>
                        <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={6}>
                            {photos.map((photo, index) => (
                                <Box key={index} borderWidth="1px" borderRadius="lg" overflow="hidden" marginTop='8' onClick={() => onPressPhoto(photo)}>
                                    <Image 
                                        src={`data:image/png;base64,${photo.photo_base64}`}
                                        alt={`Photo ${index + 1}`} 
                                        width="100%"
                                        height="200px"
                                        objectFit="cover"
                                    />
                                    <Box p={4}>
                                        <Text fontSize="sm" color="gray.500">
                                            {photo.photo_date}
                                        </Text>
                                        <Text fontSize="sm" color="gray.500">
                                            Status: {photo.photo_status}</Text>
                                    </Box>
                                </Box>
                            ))}
                        </Grid>
                        {/* Paginación */}
                        <Box display="flex" justifyContent="center" alignItems="center" mt={6} gap={2}>
                            <Button
                            onClick={() => {
                               const newPage = Math.max(page - 1, 1);
                                setPage(newPage);
                                localStorage.setItem('photos_current_page', newPage.toString());
                                setIsPaginating(true);
                            }}
                                disabled={page === 1}
                                size="sm"
                            >
                                Anterior
                            </Button>
                            <Text fontSize="md" color={"black"}>
                                Página {page} de {Math.max(1, Math.ceil(total / limitPhotosPerPage))}
                            </Text>
                            <Button
                            onClick={() => {
                               const newPage = page + 1;
                                setPage(newPage);
                                localStorage.setItem('photos_current_page', newPage.toString());
                                setIsPaginating(true);
                            }}
                                disabled={page >= Math.ceil(total / limitPhotosPerPage)}
                                size="sm"
                            >
                                Siguiente
                            </Button>
                        </Box>
                    </>}
                </>
            )}
        </Box>
    );
}
export default PhotosScreen;
