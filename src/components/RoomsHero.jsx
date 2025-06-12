import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay"

const RoomsHero = ({ imageUrls }) => {
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
                            <div
                                className="h-screen w-full bg-cover bg-center"
                                style={{ backgroundImage: `url('${url}')` }}
                            />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {/* <CarouselPrevious className="absolute top-1/2 left-4 -translate-y-1/2 text-white" />
                <CarouselNext className="absolute top-1/2 right-4 -translate-y-1/2 text-white" /> */}
            </Carousel>

            {/* Overlay Title */}
            <div className="absolute top-1/2 w-full text-center px-4">
                <h1 className="text-4xl md:text-7xl font-bold text-white drop-shadow-lg">
                    Accommodations
                </h1>
            </div>
        </div>
    );
}
export default RoomsHero;