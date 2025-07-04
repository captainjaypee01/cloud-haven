import { Button } from "@/components/ui/button";

const AvailabilityModal = ({ open, items, onClose }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-xl w-[320px]">
                <h2 className="text-lg font-bold mb-3">Some rooms are no longer available:</h2>
                <ul className="mb-3 text-sm">
                    {items.map(item => (
                        <li key={item.room_id} className="mb-2">
                            Room ID {item.room_id} — Only {item.available_count} left
                        </li>
                    ))}
                </ul>
                <Button variant="outline" className="cursor-pointer w-full" onClick={onClose}>Back to Cart</Button>
            </div>
        </div>
    );
}
export default AvailabilityModal;
