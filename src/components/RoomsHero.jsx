import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay"
import OptimizedImage from '@/components/common/OptimizedImage'

const RoomsHero = ({ imageUrls, title = "Accommodations" }) => {
    return (
        <div className="relative w-full">
            <Carousel
                className="h-screen w-full"
                opts={{ loop: true, align: "center" }}
                plugins={[
                    Autoplay({
                        playOnInit: true,
                        delay: 3000,
                    }),
                ]}
            >
                <CarouselContent>
                    {imageUrls.map((url, idx) => (
                        <CarouselItem key={idx}>
                            <div className="h-screen w-full relative" style={{ aspectRatio: '16/9' }}>
                                <div className="absolute inset-0 -z-10">
                                    <OptimizedImage 
                                        src={url} 
                                        alt={`Premium accommodations at Netania De Laiya resort in Laiya, Batangas - ${idx + 1}`} 
                                        className="w-full h-full object-cover" 
                                        aspectRatio="16/9"
                                        loading={idx === 0 ? "eager" : "lazy"}
                                    />
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {/* <CarouselPrevious className="absolute top-1/2 left-4 -translate-y-1/2 text-white" />
                <CarouselNext className="absolute top-1/2 right-4 -translate-y-1/2 text-white" /> */}
            </Carousel>

            {/* Overlay Title */}
            <div className="absolute top-1/2 w-full text-center px-4">
                <h1 className="text-4xl md:text-7xl font-bold text-white drop-shadow-lg">
                    {title}
                </h1>
            </div>
        </div>
    );
}
export default RoomsHero;