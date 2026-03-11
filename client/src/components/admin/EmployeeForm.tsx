import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployeeSchema, type InsertEmployee, type Employee } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/api";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserCircle, MapPin, Building2, Link as LinkIcon, Globe } from "lucide-react";

interface EmployeeFormProps {
  initialData?: Employee;
  onSubmit: (data: InsertEmployee) => void;
  isPending: boolean;
}

export function EmployeeForm({ initialData, onSubmit, isPending }: EmployeeFormProps) {
  const form = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      id: "",
      fullName: "",
      position: "",
      position_en: "",
      department: "",
      department_en: "",
      email: "",
      phone: "",
      fax: "",
      phoneExt: "",
      avatarUrl: "",
      companyName: "HSC",
      companyName_en: "HSC",
      companyLogoUrl: "",
      linkedinUrl: "",
      facebookUrl: "",
      mobilePhone: "",
      websiteUrl: "",
      address: "",
      address_en: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        id: initialData.id,
        fullName: initialData.fullName,
        position: initialData.position,
        position_en: (initialData as any).position_en || "",
        department: initialData.department,
        department_en: (initialData as any).department_en || "",
        email: initialData.email,
        phone: initialData.phone,
        fax: initialData.fax || "",
        phoneExt: initialData.phoneExt || "",
        avatarUrl: initialData.avatarUrl || "",
        backgroundUrl: initialData.backgroundUrl || "",
        companyName: initialData.companyName,
        companyName_en: (initialData as any).companyName_en || initialData.companyName,
        companyLogoUrl: initialData.companyLogoUrl || "",
        linkedinUrl: initialData.linkedinUrl || "",
        facebookUrl: initialData.facebookUrl || "",
        mobilePhone: initialData.mobilePhone || "",
        websiteUrl: initialData.websiteUrl || "",
        address: initialData.address || "",
        address_en: (initialData as any).address_en || initialData.address || "",
        mainOffice: (initialData as any).mainOffice || "",
        mainOffice_en: (initialData as any).mainOffice_en || (initialData as any).mainOffice || "",
        isActive: initialData.isActive,
      });
    }
  }, [initialData, form]);

  const previewValues = form.watch();

  const [uploading, setUploading] = useState(false);
  const [backgroundUploading, setBackgroundUploading] = useState(false);

  // if user chooses file locally, show a blob preview until upload returns remote URL
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // preview locally
    const objectUrl = URL.createObjectURL(file);
    form.setValue("avatarUrl", objectUrl);

    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);
    try {
      const res = await fetchWithAuth("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        form.setValue("avatarUrl", data.url);
      } else {
        console.error("Upload failed", data);
      }
    } catch (err) {
      console.error("Upload error", err);
    } finally {
      setUploading(false);
    }
  };

  const handleBackgroundFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    form.setValue("backgroundUrl", objectUrl);

    const formData = new FormData();
    formData.append("avatar", file); // reuse same endpoint

    setBackgroundUploading(true);
    try {
      const res = await fetchWithAuth("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        form.setValue("backgroundUrl", data.url);
      } else {
        console.error("Upload failed", data);
      }
    } catch (err) {
      console.error("Upload error", err);
    } finally {
      setBackgroundUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Form Section */}
      <Card className="p-6 h-[75vh] overflow-hidden flex flex-col border-border/50 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-display font-semibold">Employee Details</h3>
          <p className="text-sm text-muted-foreground">Fill in the contact information for the digital card.</p>
        </div>
        <ScrollArea className="flex-1 pr-4">
          <Form {...form}>
            <form
                onSubmit={form.handleSubmit((values) => {
                  // extra client-side guard to show popup when id is missing/invalid
                  if (!values.id || values.id.trim() === "") {
                    alert("Employee ID is required");
                    return;
                  }
                  if (/\s/.test(values.id)) {
                    alert("Employee ID cannot contain spaces");
                    return;
                  }
                  onSubmit(values);
                })}
                className="space-y-6 pb-6">
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <UserCircle className="w-4 h-4" /> Basic Info
                </div>
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee ID *</FormLabel>
                        <FormControl><Input placeholder="e.g. NV001" disabled={!!initialData} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position *</FormLabel>
                        <FormControl><Input placeholder="Senior Director" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department *</FormLabel>
                        <FormControl><Input placeholder="Investment Banking" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="position_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position EN</FormLabel>
                        <FormControl><Input placeholder="Senior Director" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department EN</FormLabel>
                        <FormControl><Input placeholder="Investment Banking" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL</FormLabel>

                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                        />
                        {uploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
                        {previewValues.avatarUrl && (
                          <img
                            src={previewValues.avatarUrl}
                            alt="avatar preview"
                            className="w-12 h-12 rounded-full object-cover border"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://ui-avatars.com/api/?name=" +
                                (previewValues.fullName || "User") +
                                "&background=1a3a5c&color=fff&size=256";
                            }}
                          />
                        )}
                      </div>

                      <FormControl><Input placeholder="https://example.com/avatar.jpg" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="backgroundUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Background Image URL</FormLabel>

                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleBackgroundFileChange}
                        />
                        {backgroundUploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
                        {previewValues.backgroundUrl && (
                          <img
                            src={previewValues.backgroundUrl}
                            alt="background preview"
                            className="w-20 h-12 object-cover border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>

                      <FormControl><Input placeholder="https://example.com/bg.jpg" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <MapPin className="w-4 h-4" /> Contact & Location
                </div>
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl><Input type="email" placeholder="john@hsc.com.vn" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl><Input placeholder="+84 90 123 4567" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phoneExt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Extension (Opt)</FormLabel>
                        <FormControl><Input placeholder="Ext. 1234" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobilePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Phone (Opt)</FormLabel>
                        <FormControl><Input placeholder="0901234567" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fax (Opt)</FormLabel>
                        <FormControl><Input placeholder="+84 90 123 4567" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Address (Opt)</FormLabel>
                      <FormControl><Input placeholder="Level 5, AB Tower, HCMC" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Address EN (Opt)</FormLabel>
                      <FormControl><Input placeholder="Level 5, AB Tower, HCMC" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mainOffice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Office (Opt)</FormLabel>
                      <FormControl><Input placeholder="Headquarters address" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mainOffice_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Office EN (Opt)</FormLabel>
                      <FormControl><Input placeholder="Headquarters address" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <LinkIcon className="w-4 h-4" /> Social & Web
                </div>
                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link URL</FormLabel>
                        <FormControl><Input placeholder="https://..." {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="facebookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zalo URL</FormLabel>
                        <FormControl><Input placeholder="https://zalo.me/..." {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Website</FormLabel>
                      <FormControl><Input placeholder="https://..." {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Building2 className="w-4 h-4" /> Company Overlay
                </div>
                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyName_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name EN</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyLogoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website Company URL</FormLabel>
                        <FormControl><Input placeholder="https://company.com" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-muted/30">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Card</FormLabel>
                      <FormDescription>
                        When turned off, the public link will show a 404 page.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Saving..." : initialData ? "Save Changes" : "Create Employee"}
              </Button>
            </form>
          </Form>
        </ScrollArea>
      </Card>

      {/* Live Preview Section */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-muted/30 rounded-xl border border-border/50 p-8 h-[75vh]">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-6">Live Preview</h3>
        
        {/* Miniature mobile frame */}
        <div className="w-[320px] h-[640px] bg-background rounded-[2.5rem] border-[8px] border-foreground/10 shadow-2xl overflow-hidden relative shadow-foreground/5">
          <div
            className="absolute top-0 w-full h-32"
            style={
              previewValues.backgroundUrl
                ? {
                    backgroundImage: `url(${previewValues.backgroundUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            {!previewValues.backgroundUrl && <div className="absolute inset-0 bg-hero-pattern" />}
          </div>
          
          <div className="relative pt-16 px-6 pb-6 flex flex-col items-center h-full">
            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg z-10 mb-4">
              <img 
                src={previewValues.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop"} 
                alt="Avatar" 
                className="w-full h-full rounded-full object-cover"
                onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=" + (previewValues.fullName || "User") + "&background=1a3a5c&color=fff"; }}
              />
            </div>
            
            <h2 className="text-xl font-display font-bold text-center text-foreground truncate w-full">
              {previewValues.fullName || "John Doe"}
            </h2>
            <p className="text-sm text-primary font-medium mt-1 truncate w-full text-center">
              {(previewValues.position_en || previewValues.position) || "Position Title"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate w-full text-center">
              {(previewValues.companyName_en || previewValues.companyName) || "Company"} • {(previewValues.department_en || previewValues.department) || "Department"}
            </p>
            {(previewValues.mainOffice_en || previewValues.mainOffice) && (
              <p className="text-xs text-muted-foreground mt-1 truncate w-full text-center">
                {(previewValues.mainOffice_en || previewValues.mainOffice)}
              </p>
            )}
            
            <div className="flex gap-3 mt-6">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <div className="w-4 h-4 bg-primary/20 rounded-full"></div>
                </div>
              ))}
            </div>
            
            <div className="w-full mt-auto space-y-3">
              <div className="h-12 bg-primary rounded-xl opacity-90"></div>
              <div className="h-12 border-2 border-primary/20 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
