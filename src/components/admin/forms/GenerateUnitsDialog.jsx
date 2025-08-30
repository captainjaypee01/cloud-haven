// components/admin/forms/GenerateUnitsDialog.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { toast } from "sonner";
import { Plus, Minus, Eye } from 'lucide-react';

const GenerateUnitsDialog = ({ open, onOpenChange, room, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ranges");
  const [skipExisting, setSkipExisting] = useState(true);
  
  // Ranges state
  const [ranges, setRanges] = useState([
    { prefix: '', start: 101, end: 106 }
  ]);
  
  // Manual numbers state  
  const [manualNumbers, setManualNumbers] = useState('');
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewNumbers, setPreviewNumbers] = useState([]);
  
  const api = useApi();

  const addRange = () => {
    setRanges([...ranges, { prefix: '', start: 101, end: 106 }]);
  };

  const removeRange = (index) => {
    if (ranges.length > 1) {
      setRanges(ranges.filter((_, i) => i !== index));
    }
  };

  const updateRange = (index, field, value) => {
    const updated = [...ranges];
    updated[index][field] = field === 'prefix' ? value : parseInt(value) || 0;
    setRanges(updated);
  };

  const generatePreview = () => {
    let numbers = [];
    
    if (activeTab === "ranges") {
      ranges.forEach(range => {
        const { prefix, start, end } = range;
        if (start && end && start <= end) {
          for (let i = start; i <= end; i++) {
            const padded = String(i).padStart(String(start).length, '0');
            numbers.push((prefix || '') + padded);
          }
        }
      });
    } else {
      const manual = manualNumbers.split(/[,\n]/)
        .map(n => n.trim())
        .filter(n => n.length > 0);
      numbers = [...new Set(manual)]; // Remove duplicates
    }
    
    // Remove duplicates across all ranges
    numbers = [...new Set(numbers)];
    
    setPreviewNumbers(numbers);
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    if (!room) return;
    
    setLoading(true);
    
    try {
      let payload = { skip_existing: skipExisting };
      let allNumbers = [];
      
      if (activeTab === "ranges") {
        payload.ranges = ranges.filter(r => r.start && r.end && r.start <= r.end);
        if (payload.ranges.length === 0) {
          toast.error("Please add at least one valid range");
          setLoading(false);
          return;
        }
        
        // Generate all numbers from ranges to check quantity
        payload.ranges.forEach(range => {
          const { prefix, start, end } = range;
          for (let i = start; i <= end; i++) {
            const padded = String(i).padStart(String(start).length, '0');
            allNumbers.push((prefix || '') + padded);
          }
        });
      } else {
        const numbers = manualNumbers.split(/[,\n]/)
          .map(n => n.trim())
          .filter(n => n.length > 0);
        
        if (numbers.length === 0) {
          toast.error("Please enter at least one room number");
          setLoading(false);
          return;
        }
        
        allNumbers = [...new Set(numbers)]; // Remove duplicates
        payload.numbers = allNumbers;
      }
      
      // Remove duplicates across all ranges
      allNumbers = [...new Set(allNumbers)];
      
             // Check if total units exceed room quantity
       // Note: We can't check existing units count from frontend, so we'll let backend handle this validation
       // The backend will check existing + new units against room quantity
      
      // Update payload with deduplicated numbers
      if (activeTab === "ranges") {
        // For ranges, we need to regenerate the ranges without duplicates
        // This is complex, so we'll let the backend handle it
      } else {
        payload.numbers = allNumbers;
      }
      
      const response = await api.post(
        `${API_PREFIX}/admin/room-types/${room.id}/units/generate`,
        payload,
        { requiresAuth: true }
      );
      
      if (response.data?.success) {
        const { total_created, total_skipped } = response.data.data;
        if (total_created > 0) {
          toast.success(`Generated ${total_created} room units successfully!` +
            (total_skipped > 0 ? ` (${total_skipped} duplicates skipped)` : ''));
        } else if (total_skipped > 0) {
          toast.info(`All ${total_skipped} room units already exist. No new units were created.`);
        }
        onSuccess?.();
        resetForm();
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to generate room units";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRanges([{ prefix: '', start: 101, end: 106 }]);
    setManualNumbers('');
    setShowPreview(false);
    setPreviewNumbers([]);
    setActiveTab("ranges");
  };

  const handleClose = (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                 <DialogHeader>
           <DialogTitle>Generate Room Units</DialogTitle>
           <DialogDescription>
             Generate room units for <strong>{room?.name}</strong> (max: {room?.quantity} units total). 
             You can create units using ranges or manually enter specific numbers.
           </DialogDescription>
         </DialogHeader>

        <div className="space-y-6">
          {/* Skip existing toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="skip-existing"
              checked={skipExisting}
              onCheckedChange={setSkipExisting}
            />
            <Label htmlFor="skip-existing">
              Skip existing room numbers (recommended)
            </Label>
          </div>

          {/* Tabs for input methods */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ranges">By Ranges</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="ranges" className="space-y-4">
              <div className="space-y-3">
                {ranges.map((range, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Range {index + 1}</CardTitle>
                        {ranges.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeRange(index)}
                            className="cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor={`prefix-${index}`}>Prefix (optional)</Label>
                          <Input
                            id={`prefix-${index}`}
                            placeholder="e.g., A, B"
                            value={range.prefix}
                            onChange={(e) => updateRange(index, 'prefix', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`start-${index}`}>Start Number</Label>
                          <Input
                            id={`start-${index}`}
                            type="number"
                            min="1"
                            value={range.start}
                            onChange={(e) => updateRange(index, 'start', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`end-${index}`}>End Number</Label>
                          <Input
                            id={`end-${index}`}
                            type="number"
                            min="1"
                            value={range.end}
                            onChange={(e) => updateRange(index, 'end', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Example: {range.prefix}{String(range.start).padStart(String(range.start).length, '0')} to {range.prefix}{String(range.end).padStart(String(range.start).length, '0')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={addRange}
                className="w-full cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Range
              </Button>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div>
                <Label htmlFor="manual-numbers">Room Numbers</Label>
                <textarea
                  id="manual-numbers"
                  className="w-full min-h-[120px] p-3 border rounded-md resize-vertical"
                  placeholder="Enter room numbers separated by commas or new lines:&#10;101, 102, 103&#10;201&#10;202&#10;203"
                  value={manualNumbers}
                  onChange={(e) => setManualNumbers(e.target.value)}
                />
                <div className="text-sm text-muted-foreground mt-2">
                  Separate room numbers with commas or new lines. Duplicates will be removed automatically.
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Preview section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Preview</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={generatePreview}
                className="cursor-pointer"
              >
                <Eye className="w-4 h-4 mr-2" />
                Generate Preview
              </Button>
            </div>
            
            {showPreview && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {previewNumbers.length} room units will be created:
                </div>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {previewNumbers.map((num, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {num}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dialog actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="cursor-pointer"
          >
            {loading ? "Generating..." : "Generate Units"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateUnitsDialog;
