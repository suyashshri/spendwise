"use client";

import { useEffect, useState } from "react";
import { SUPPORTED_CURRENCIES, type Transaction } from "@spendwise/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useCategoryStore } from "@/store/categoryStore";
import { useTransactionStore } from "@/store/transactionStore";
import { extractApiErrorMessage } from "@/lib/api";

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present -> edit mode; absent -> create mode. */
  transaction?: Transaction | null;
}) {
  const { user } = useAuth();
  const categories = useCategoryStore((s) => s.categories);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);

  const isEdit = Boolean(transaction);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (transaction) {
      setAmount(String(transaction.amount));
      setCurrency(transaction.currency);
      setMerchant(transaction.merchant);
      setCategory(transaction.category);
      setNote(transaction.note ?? "");
    } else {
      setAmount("");
      setCurrency(user?.currency ?? "INR");
      setMerchant("");
      setCategory(categories[0]?.name ?? "Miscellaneous");
      setNote("");
    }
    setError(null);
  }, [open, transaction, user?.currency, categories]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!(parsedAmount > 0) || !merchant.trim()) {
      setError("Enter a valid amount and payee");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      if (isEdit && transaction) {
        await updateTransaction(transaction.id, {
          amount: parsedAmount,
          currency,
          merchant: merchant.trim(),
          category,
          note: note.trim() || undefined,
        });
      } else {
        await addTransaction({
          amount: parsedAmount,
          currency,
          merchant: merchant.trim(),
          category,
          date: new Date().toISOString(),
          note: note.trim() || undefined,
        });
      }
      onOpenChange(false);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit transaction" : "Add expense"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this transaction's details." : "Record a manual expense."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(value) => value && setCurrency(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="merchant">Paid to</Label>
            <Input
              id="merchant"
              placeholder="e.g. Swiggy, Landlord"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(value) => value && setCategory(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? "Saving…" : isEdit ? "Save changes" : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
