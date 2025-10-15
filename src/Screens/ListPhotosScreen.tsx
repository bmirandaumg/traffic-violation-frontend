//Screen basic whit a list of photos
import React, { useEffect, useState } from 'react';
import { Box, Grid, Image, Spinner, Text, Select, createListCollection, Portal, Input, Field, Button } from '@chakra-ui/react';
import { CruiseService } from '@/services/cruise.service';
import { PhotosService, type Photo } from '@/services/photos.service';
import { useNavigate } from "react-router-dom";

type CruiseItem = { label: string; value: number };
type CruiseCollection = ReturnType<typeof createListCollection<CruiseItem>>;

const PhotosScreen: React.FC = () => {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [cruiseCollection, setCruiseCollection] = useState<CruiseCollection | undefined>(undefined);
    const [selectedCruise, setSelectedCruise] = useState<string>("");
    const [date, setDate] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [hasAutoSearched, setHasAutoSearched] = useState<boolean>(false);
    const [noPhotosMessage, setNoPhotosMessage] = useState<string>("");
    const navigate = useNavigate();

    const fetchPhotos = async (cruise_id: number, date: string, page: number) => {
        try {
            setLoading(true);
            setNoPhotosMessage(""); // Limpiar mensaje anterior
            
            const data = await PhotosService.getAll(cruise_id, date, page);
            console.log(data);
            
            // Verificar SOLO si es array vacío (manteniendo lógica original)
            if (Array.isArray(data) && data.length === 0) {
                setPhotos([]);
                setNoPhotosMessage(`No se encontraron fotos para la fecha ${date} en el crucero seleccionado`);
            } else {
                // Lógica original intacta
                setPhotos(data);
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
            const cruises = await CruiseService.get();
            const cruiseItems: CruiseItem[] = cruises.map((cruise) => ({
                label: cruise.cruise_name,
                value: cruise.id,
            }));
            const cruiseCollection = createListCollection<CruiseItem>({
                items: cruiseItems,
            });
            setCruiseCollection(cruiseCollection);
        } catch (error) {
            console.error("Error fetching cruises:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCruises();
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
        if (selectedCruise && date && cruiseCollection && !hasAutoSearched) {
            setHasAutoSearched(true);
            // Usar setTimeout para evitar conflictos con el loading state
            setTimeout(() => {
                fetchPhotos(parseInt(selectedCruise), date, 1);
            }, 100);
        }
    }, [selectedCruise, date, cruiseCollection, hasAutoSearched]);


    const onPressPhoto = async (photo: Photo) => {
        try {
        await PhotosService.blockPhoto(photo.id);
        navigate("/photo" , { state: { photo } });
        } catch (error) {
            console.error("Error bloqueando la foto:", error);
            // Puedes mostrar un mensaje de error si lo deseas
        }
    }

    return (
        <Box p={4} backgroundColor="white" minH="100vh">
            <Text fontSize="2xl" mb={4} fontWeight="bold">
                Photos
            </Text>
            {loading ? (
                <Spinner size="xl" />
            ) : (
                <>
                    <Box display="flex" flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center"
                        w="90%" gap="2">
                        <Select.Root
                            collection={cruiseCollection as CruiseCollection}
                            size="sm"
                            width="320px"
                            color='black'
                            multiple={false}
                            value={selectedCruise ? [selectedCruise] : []}
                            onValueChange={(e) => {
                                const [val] = e.value
                                setSelectedCruise(val)
                            }}
                            disabled={!cruiseCollection}
                        >
                            <Select.HiddenSelect />
                            <Select.Label>Crucero</Select.Label>
                            <Select.Control>
                                <Select.Trigger>
                                    <Select.ValueText placeholder="Selecciona un crucero" />
                                </Select.Trigger>
                                <Select.IndicatorGroup>
                                    <Select.Indicator />
                                </Select.IndicatorGroup>
                            </Select.Control>
                            <Portal>
                                <Select.Positioner>
                                    <Select.Content>
                                        {cruiseCollection?.items.map((cruise: CruiseItem) => (
                                            <Select.Item item={cruise} key={cruise.value}>
                                                {cruise.label}
                                                <Select.ItemIndicator />
                                            </Select.Item>
                                        ))}
                                    </Select.Content>
                                </Select.Positioner>
                            </Portal>
                        </Select.Root>

                        <Field.Root >
                            <Field.Label>Fecha</Field.Label>
                            <Input placeholder="Fecha" type='date' color='black'
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </Field.Root>

                        <Button 
                            alignSelf='flex-end' 
                            bg='#83D00D' 
                            color='white' 
                            _hover={{ bg: "#4cae4c" }}
                            onClick={() => {
                                if (selectedCruise && date) {
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

                    {photos && <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={6}>
                        {photos.map((photo, index) => (
                            <Box key={index} borderWidth="1px" borderRadius="lg" overflow="hidden" marginTop='8' onClick={() => onPressPhoto(photo)}>
                                <Image 
                                    src={`data:image/png;base64,${photo.photo_base64}`}

                                alt={`Photo ${index + 1}`} boxSize="200px" objectFit="cover" />
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
                    }
                </>
            )}
        </Box>
    );
}
export default PhotosScreen;