import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { useExpenses } from "@/hooks/use-expenses";
import { CATEGORIES, ExpenseCategory } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

const ExpensesPage = () => {
  const { expenses, selectedMonth, setSelectedMonth, addExpense, updateExpense, deleteExpense } = useExpenses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Form state
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  
  // 1. Initialize date picker dynamically matching the selected dropdown month context
  const [date, setDate] = useState(`${selectedMonth}-01`);
  const [description, setDescription] = useState("");

  // 2. Automatically sync the form default date input whenever the user shifts months
  useEffect(() => {
    if (!editId) {
      setDate(`${selectedMonth}-01`);
    }
  }, [selectedMonth, editId]);

  const resetForm = () => {
    setAmount("");
    setCategory("food");
    setDate(`${selectedMonth}-01`); // Defaults back to the actively viewed month
    setDescription("");
    setEditId(null);
  };

  const openEdit = (id: string) => {
    const e = expenses.find((ex) => ex.id === id);
    if (!e) return;
    setAmount(e.amount.toString());
    setCategory(e.category);
    setDate(e.date);
    setDescription(e.description);
    setEditId(id);
    setDialogOpen(true);
  };

  // 3. Make the submit handler async to safeguard the MySQL pipeline sequence
  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    try {
      if (editId) {
        await updateExpense(editId, { amount: parsedAmount, category, date, description });
        toast.success("Expense updated");
      } else {
        await addExpense({ amount: parsedAmount, category, date, description });
        toast.success("Expense added");
      }
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      toast.error("Failed to commit data loop changes.");
    }
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    toast.success("Expense deleted");
  };

  const getMonthOptions = () => {
    const options = [];
    const iteratorDate = new Date();
    for (let i = 0; i < 12; i++) {
      const year = iteratorDate.getFullYear();
      const monthStr = String(iteratorDate.getMonth() + 1).padStart(2, '0');
      const textLabel = iteratorDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      options.push({ value: `${year}-${monthStr}`, label: textLabel });
      iteratorDate.setMonth(iteratorDate.getMonth() - 1);
    }
    return options;
  };

  const filtered = filterCategory === "all"
    ? expenses
    : expenses.filter((e) => e.category === filterCategory);

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">Review and audit your transaction ledger logs.</p>
        </div>
        
        <div className="flex items-gap gap-3 self-end sm:self-auto">
          <div className="flex items-center space-x-2 bg-background border rounded-lg p-1.5 shadow-sm max-w-xs h-9">
            <Calendar className="h-4 w-4 text-muted-foreground ml-1.5 flex-shrink-0" />
            <select
              id="history-statement-period"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none pr-8 cursor-pointer text-foreground"
            >
              {getMonthOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9">
                <Plus className="mr-1 h-4 w-4" /> Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Expense" : "Add Expense"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.icon} {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="What was this for?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleSubmit}>
                  {editId ? "Update" : "Add"} Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground">Filter Category:</Label>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.icon} {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {sorted.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((e) => {
                  const cat = CATEGORIES.find((c) => c.value === e.category);
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm">{format(parseISO(e.date), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <span className="text-sm">{cat?.icon} {cat?.label}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.description || "—"}</TableCell>
                      <TableCell className="text-right font-medium">${e.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e.id)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(e.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No expenses found for this month period. Click "Add Expense" to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesPage;