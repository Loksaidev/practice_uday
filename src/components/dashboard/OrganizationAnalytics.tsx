import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Users, Trophy, Sparkles, Download, FileText, FileSpreadsheet, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";

interface AnalyticsData {
  id: string;
  topic_id: string;
  topic_name: string;
  topic_category: string;
  is_custom_topic: boolean;
  is_auth_player: boolean;
  created_at: string;
  player_name: string;
  organization_id: string;
}

interface OrganizationAnalyticsProps {
  organizationId: string;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

type DateRangePreset = "7days" | "30days" | "90days" | "custom";

const OrganizationAnalytics = ({ organizationId }: OrganizationAnalyticsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("30days");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const chartsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAnalytics();
  }, [organizationId]);

  // Get filtered data based on date range
  const getFilteredData = () => {
    let startDate: Date;
    let endDate = endOfDay(new Date());

    switch (dateRangePreset) {
      case "7days":
        startDate = startOfDay(subDays(new Date(), 7));
        break;
      case "30days":
        startDate = startOfDay(subDays(new Date(), 30));
        break;
      case "90days":
        startDate = startOfDay(subDays(new Date(), 90));
        break;
      case "custom":
        if (!customStartDate || !customEndDate) return analyticsData;
        startDate = startOfDay(customStartDate);
        endDate = endOfDay(customEndDate);
        break;
      default:
        startDate = startOfDay(subDays(new Date(), 30));
    }

    return analyticsData.filter((item) => {
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const filteredData = getFilteredData();

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Call the RPC function to get analytics data
      const { data, error } = await supabase.rpc("get_org_player_selections_analytics", {
        _org_id: organizationId,
      });

      if (error) throw error;

      setAnalyticsData(data || []);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load analytics data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      const headers = [
        "Date",
        "Player Name",
        "Topic Name",
        "Category",
        "Topic Type",
        "Player Type",
      ];

      const rows = filteredData.map((item) => [
        format(new Date(item.created_at), "yyyy-MM-dd HH:mm:ss"),
        item.player_name,
        item.topic_name,
        item.topic_category,
        item.is_custom_topic ? "Custom" : "Standard",
        item.is_auth_player ? "Authenticated" : "Anonymous",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `analytics-${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: "Analytics data exported as CSV.",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export CSV file.",
      });
    }
  };

  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Title
      pdf.setFontSize(20);
      pdf.text("Analytics Report", pageWidth / 2, 15, { align: "center" });
      pdf.setFontSize(12);
      pdf.text(format(new Date(), "MMMM dd, yyyy"), pageWidth / 2, 22, { align: "center" });
      
      let yPosition = 35;

      // Summary statistics
      const summaryData = [
        ["Total Selections", totalSelections.toString()],
        ["Unique Players", uniquePlayers.toString()],
        ["Custom Topics", `${customTopicCount} (${totalSelections > 0 ? Math.round((customTopicCount / totalSelections) * 100) : 0}%)`],
        ["Auth Players", `${authPlayerCount} (${totalSelections > 0 ? Math.round((authPlayerCount / totalSelections) * 100) : 0}%)`],
      ];

      autoTable(pdf, {
        startY: yPosition,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [30, 174, 219] },
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 10;

      // Top topics table
      if (topTopicsData.length > 0) {
        pdf.setFontSize(14);
        pdf.text("Top Topics", 14, yPosition);
        yPosition += 7;

        autoTable(pdf, {
          startY: yPosition,
          head: [["Topic Name", "Selections"]],
          body: topTopicsData.map((item) => [item.name, item.count.toString()]),
          theme: "striped",
          headStyles: { fillColor: [30, 174, 219] },
        });

        yPosition = (pdf as any).lastAutoTable.finalY + 10;
      }

      // Capture charts
      if (chartsRef.current) {
        const charts = chartsRef.current.querySelectorAll(".chart-container");
        
        for (let i = 0; i < charts.length; i++) {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }

          const chart = charts[i] as HTMLElement;
          const canvas = await html2canvas(chart, { scale: 2 });
          const imgData = canvas.toDataURL("image/png");
          const imgWidth = pageWidth - 28;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          pdf.addImage(imgData, "PNG", 14, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        }
      }

      // Category distribution table
      if (categoryChartData.length > 0) {
        if (yPosition > 220) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.text("Category Distribution", 14, yPosition);
        yPosition += 7;

        autoTable(pdf, {
          startY: yPosition,
          head: [["Category", "Selections"]],
          body: categoryChartData.map((item) => [item.name, item.count.toString()]),
          theme: "striped",
          headStyles: { fillColor: [30, 174, 219] },
        });
      }

      pdf.save(`analytics-${format(new Date(), "yyyy-MM-dd")}.pdf`);

      toast({
        title: "Export Successful",
        description: "Analytics report exported as PDF.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export PDF file.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Calculate summary statistics from filtered data
  const totalSelections = filteredData.length;
  const uniquePlayers = new Set(filteredData.map(d => d.player_name)).size;
  const customTopicCount = filteredData.filter(d => d.is_custom_topic).length;
  const authPlayerCount = filteredData.filter(d => d.is_auth_player).length;

  // Top Topics (from filtered data)
  const topicCounts = filteredData.reduce((acc, item) => {
    acc[item.topic_name] = (acc[item.topic_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTopicsData = Object.entries(topicCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Custom vs Standard Topics
  const topicTypeData = [
    { name: "Custom Topics", value: customTopicCount },
    { name: "Standard Topics", value: totalSelections - customTopicCount },
  ];

  // Auth vs Anonymous Players
  const playerTypeData = [
    { name: "Authenticated", value: authPlayerCount },
    { name: "Anonymous", value: totalSelections - authPlayerCount },
  ];

  // Engagement over time (from filtered data)
  const engagementByDate = filteredData.reduce((acc, item) => {
    const date = format(new Date(item.created_at), "MMM dd");
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const engagementData = Object.entries(engagementByDate)
    .map(([date, count]) => ({ date, selections: count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Category Distribution (from filtered data)
  const categoryData = filteredData.reduce((acc, item) => {
    acc[item.topic_category] = (acc[item.topic_category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryData)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Filter and Export Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select
            value={dateRangePreset}
            onValueChange={(value) => setDateRangePreset(value as DateRangePreset)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {dateRangePreset === "custom" && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px]">
                    {customStartDate ? format(customStartDate, "MMM dd, yyyy") : "Start Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px]">
                    {customEndDate ? format(customEndDate, "MMM dd, yyyy") : "End Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={totalSelections === 0}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            disabled={totalSelections === 0 || isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Selections</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSelections}</div>
            <p className="text-xs text-muted-foreground">
              All player topic selections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniquePlayers}</div>
            <p className="text-xs text-muted-foreground">
              Players who made selections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Topics</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customTopicCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalSelections > 0 ? Math.round((customTopicCount / totalSelections) * 100) : 0}% of all selections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auth Players</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authPlayerCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalSelections > 0 ? Math.round((authPlayerCount / totalSelections) * 100) : 0}% authenticated
            </p>
          </CardContent>
        </Card>
      </div>

      {totalSelections === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Analytics Data Yet</h3>
              <p className="text-muted-foreground">
                Analytics will appear here once players start making topic selections in your games.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div ref={chartsRef}>
          {/* Engagement Trend */}
          {engagementData.length > 0 && (
            <Card className="chart-container">
              <CardHeader>
                <CardTitle>Engagement Trend</CardTitle>
                <CardDescription>Daily player topic selections</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="selections" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Custom vs Standard Topics */}
            <Card className="chart-container">
              <CardHeader>
                <CardTitle>Topic Type Usage</CardTitle>
                <CardDescription>Custom vs standard topics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={topicTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {topicTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Auth vs Anonymous */}
            <Card className="chart-container">
              <CardHeader>
                <CardTitle>Player Type Distribution</CardTitle>
                <CardDescription>Authenticated vs anonymous players</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={playerTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {playerTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Topics */}
          {topTopicsData.length > 0 && (
            <Card className="chart-container">
              <CardHeader>
                <CardTitle>Top 10 Most Popular Topics</CardTitle>
                <CardDescription>Topics selected most frequently by players</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topTopicsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Selections" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Category Distribution */}
          {categoryChartData.length > 0 && (
            <Card className="chart-container">
              <CardHeader>
                <CardTitle>Topic Categories</CardTitle>
                <CardDescription>Distribution of selections by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(var(--secondary))" name="Selections" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationAnalytics;
