import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { format } from "date-fns";
import { Edit, Trash2, Plus, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useMealProgramsApi } from "@/hooks/api/useMealProgramsApi";
import Loader from "@/components/common/Loader";
import DeleteDialog from "@/components/common/form/DeleteDialog";
import PricingTierDialog from "./components/PricingTierDialog";
import CalendarOverrideDialog from "./components/CalendarOverrideDialog";

export default function MealProgramDetail() {
  const { navigate } = useAppContext();
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedOverride, setSelectedOverride] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const mealProgramsApi = useMealProgramsApi();

  const fetchProgram = async () => {
    try {
      setLoading(true);
      const response = await mealProgramsApi.show(id);
      setProgram(response.data);
    } catch (error) {
      console.error('Error fetching meal program:', error);
      toast.error("Failed to fetch meal program");
      navigate("/admin/meal-programs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProgram();
    }
  }, [id]);

  const handleSaveTier = async (data) => {
    try {
      if (selectedTier) {
        await mealProgramsApi.updatePricingTier(id, selectedTier.id, data);
        toast.success("Pricing tier updated successfully");
      } else {
        await mealProgramsApi.createPricingTier(id, data);
        toast.success("Pricing tier created successfully");
      }
      
      fetchProgram();
      setTierDialogOpen(false);
      setSelectedTier(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save pricing tier");
    }
  };

  const handleSaveOverride = async (data) => {
    try {
      if (selectedOverride) {
        await mealProgramsApi.updateCalendarOverride(id, selectedOverride.id, data);
        toast.success("Calendar override updated successfully");
      } else {
        await mealProgramsApi.createCalendarOverride(id, data);
        toast.success("Calendar override created successfully");
      }
      
      fetchProgram();
      setOverrideDialogOpen(false);
      setSelectedOverride(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save calendar override");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem || !deleteType) return;

    try {
      if (deleteType === "tier") {
        await mealProgramsApi.removePricingTier(id, deleteItem.id);
      } else {
        await mealProgramsApi.removeCalendarOverride(id, deleteItem.id);
      }

      toast.success(`${deleteType === "tier" ? "Pricing tier" : "Calendar override"} deleted successfully`);
      fetchProgram();
      setDeleteDialogOpen(false);
      setDeleteItem(null);
      setDeleteType(null);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to delete ${deleteType === "tier" ? "pricing tier" : "calendar override"}`);
    }
  };

  const getScopeDescription = () => {
    if (!program) return "";
    
    switch (program.scope_type) {
      case "always":
        return "This program is always active when enabled";
      case "date_range":
        return `Active from ${format(new Date(program.date_start), "MMMM d, yyyy")} to ${format(new Date(program.date_end), "MMMM d, yyyy")}`;
      case "months":
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `Active during: ${program.months.map(m => monthNames[m - 1]).join(", ")}`;
      case "weekly":
        if (program.weekdays?.length) {
          return `Active on: ${program.weekdays.join(", ")}`;
        }
        return `Active on ${program.weekend_definition === "FRI_SUN" ? "Friday, Saturday, and Sunday" : "Saturday and Sunday"}`;
      case "composite":
        return "This program uses multiple rules to determine when it's active";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader variant="wave" />
      </div>
    );
  }

  if (!program) {
    return null;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">{program.name}</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">{getScopeDescription()}</p>
          {program.date_start && program.date_end && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Date Range: {format(new Date(program.date_start), 'MMM dd, yyyy')} - {format(new Date(program.date_end), 'MMM dd, yyyy')}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/meal-programs/${id}/preview`)}
            className="cursor-pointer w-full sm:w-auto"
            size="sm"
          >
            <Calendar className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Preview Calendar</span>
            <span className="sm:hidden">Preview</span>
          </Button>
          <Button
            onClick={() => navigate(`/admin/meal-programs/${id}/edit`)}
            className="cursor-pointer w-full sm:w-auto"
            size="sm"
          >
            <Edit className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Edit Program</span>
            <span className="sm:hidden">Edit</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Program Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <Badge variant={program.status === "active" ? "success" : "secondary"}>
                  {program.status}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Scope Type</dt>
              <dd className="mt-1 capitalize">{program.scope_type.replace("_", " ")}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Inactive Label</dt>
              <dd className="mt-1 text-sm">{program.inactive_label}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Buffet Enabled</dt>
              <dd className="mt-1">
                <Badge variant={program.buffet_enabled ? "success" : "secondary"}>
                  {program.buffet_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
              <dd className="mt-1 text-sm">{format(new Date(program.updated_at), "MMMM d, yyyy 'at' h:mm a")}</dd>
            </div>
            {program.notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">Notes</dt>
                <dd className="mt-1 text-sm">{program.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue="pricing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pricing" className="text-xs sm:text-sm">Pricing Tiers</TabsTrigger>
          <TabsTrigger value="overrides" className="text-xs sm:text-sm">Calendar Overrides</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                <CardTitle className="text-lg sm:text-xl">Pricing Tiers</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedTier(null);
                    setTierDialogOpen(true);
                  }}
                  className="cursor-pointer w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tier
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[80px]">Currency</TableHead>
                      <TableHead className="min-w-[140px]">Full Buffet (Overnight)</TableHead>
                      <TableHead className="min-w-[120px]">Lunch Price</TableHead>
                      <TableHead className="min-w-[120px]">PM Snack Price</TableHead>
                      <TableHead className="min-w-[120px]">Dinner Price</TableHead>
                      <TableHead className="min-w-[160px]">Breakfast Price (Extra Guests)</TableHead>
                      <TableHead className="min-w-[180px]">Extra Guest Fee (Buffet Days)</TableHead>
                      <TableHead className="min-w-[120px]">Effective From</TableHead>
                      <TableHead className="min-w-[120px]">Effective To</TableHead>
                      <TableHead className="min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {program.pricing_tiers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground">
                        No pricing tiers defined. Add a tier to set meal prices.
                      </TableCell>
                    </TableRow>
                  ) : (
                    program.pricing_tiers?.map((tier) => (
                      <TableRow key={tier.id}>
                        <TableCell>{tier.currency}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Adult: {tier.adult_price}</div>
                            <div>Child: {tier.child_price}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Adult: {tier.adult_lunch_price || "—"}</div>
                            <div>Child: {tier.child_lunch_price || "—"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Adult: {tier.adult_pm_snack_price || "—"}</div>
                            <div>Child: {tier.child_pm_snack_price || "—"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Adult: {tier.adult_dinner_price || "—"}</div>
                            <div>Child: {tier.child_dinner_price || "—"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Adult: {tier.adult_breakfast_price || "—"}</div>
                            <div>Child: {tier.child_breakfast_price || "—"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Adult: {tier.adult_extra_guest_fee || "—"}</div>
                            <div>Child: {tier.child_extra_guest_fee || "—"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {tier.effective_from ? format(new Date(tier.effective_from), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell>
                          {tier.effective_to ? format(new Date(tier.effective_to), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTier(tier);
                                setTierDialogOpen(true);
                              }}
                              className="cursor-pointer p-1 sm:p-2"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setDeleteItem(tier);
                                setDeleteType("tier");
                                setDeleteDialogOpen(true);
                              }}
                              className="cursor-pointer p-1 sm:p-2"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overrides">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                <CardTitle className="text-lg sm:text-xl">Calendar Overrides</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedOverride(null);
                    setOverrideDialogOpen(true);
                  }}
                  className="cursor-pointer w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Override
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[80px]">Type</TableHead>
                      <TableHead className="min-w-[120px]">Date/Month</TableHead>
                      <TableHead className="min-w-[120px]">Override</TableHead>
                      <TableHead className="min-w-[100px]">Note</TableHead>
                      <TableHead className="min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {program.calendar_overrides?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No calendar overrides defined. Add overrides to force buffet on or off on specific dates or months.
                      </TableCell>
                    </TableRow>
                  ) : (
                    program.calendar_overrides?.map((override) => (
                      <TableRow key={override.id}>
                        <TableCell>
                          <Badge variant={override.override_type === "month" ? "default" : "outline"}>
                            {override.override_type === "month" ? "Month" : "Date"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {override.override_type === "month" 
                            ? `${new Date(2025, override.month - 1, 1).toLocaleString('default', { month: 'long' })} ${override.year}`
                            : format(new Date(override.date), "MMMM d, yyyy")
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={override.is_active ? "success" : "secondary"}>
                            {override.is_active ? "Force Buffet ON" : "Force Buffet OFF"}
                          </Badge>
                        </TableCell>
                        <TableCell>{override.note || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOverride(override);
                                setOverrideDialogOpen(true);
                              }}
                              className="cursor-pointer p-1 sm:p-2"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setDeleteItem(override);
                                setDeleteType("override");
                                setDeleteDialogOpen(true);
                              }}
                              className="cursor-pointer p-1 sm:p-2"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PricingTierDialog
        open={tierDialogOpen}
        onOpenChange={setTierDialogOpen}
        onSave={handleSaveTier}
        tier={selectedTier}
      />

      <CalendarOverrideDialog
        open={overrideDialogOpen}
        onOpenChange={setOverrideDialogOpen}
        onSave={handleSaveOverride}
        override={selectedOverride}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title={`Delete ${deleteType === "tier" ? "Pricing Tier" : "Calendar Override"}`}
        description={`Are you sure you want to delete this ${deleteType === "tier" ? "pricing tier" : "calendar override"}? This action cannot be undone.`}
      />
    </div>
  );
}
