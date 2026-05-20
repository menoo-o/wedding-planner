"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import styles from "./QuickEntryModal.module.css";
import { useRouter } from "next/navigation";

type Payer = "Myself" | "Other";

interface QuickEntryFormData {
  amount: string;
  description: string;
  category: string;
  date: string;
  paymentAccount: string;
  paidBy: Payer[];
  additionalNotes: string;
}

const CATEGORIES = ["Bills", "Food", "H.O.O.R", "Medical", "Personal Care", "Gifting", "Clothing", "Misc", "Coffee"];
const PAYMENT_ACCOUNTS = ["Cash","Card"];

function formatAmount(raw: string): string {
  const numeric = raw.replace(/[^0-9.]/g, "");
  const parts = numeric.split(".");
  const integer = parts[0] || "0";
  const decimal = parts[1] !== undefined ? "." + parts[1].slice(0, 2) : "";
  return integer + decimal;
}


interface QuickEntryModalProps {
//   onClose?: () => void;
  todayStr: string;
}

export default function QuickEntryModal({ todayStr }: QuickEntryModalProps) {

  const {
    register,
    handleSubmit,
    control,
    //watch
    formState: { errors },
  } = useForm<QuickEntryFormData>({
    defaultValues: {
      amount: "",
      description: "",
      category: "Cash",
      date: todayStr,
      paymentAccount: "Cash",
      paidBy: ["Myself"],
      additionalNotes: "",
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
//   const amountRaw = watch("amount");
const router = useRouter();


  const onSubmit = async (data: QuickEntryFormData) => {
    setSubmitting(true);
    // Simulate POST to DB
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Quick Entry Form Data:", {
      ...data,
      amount: parseFloat(data.amount || "0").toFixed(2),
    });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      router.push("/");
    }, 1500);
  };

  // Trap focus inside modal
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable[0]?.focus();
  }, []);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Quick Entry">
      <div className={styles.modal} ref={modalRef}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Quick Entry</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => router.push("/")}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Amount Display */}
          <div className={styles.amountSection}>
            <span className={styles.amountLabel}>AMOUNT</span>
            <div className={styles.amountDisplay}>
              <span className={styles.currencySymbol}>$</span>
              <input
                {...register("amount", {
                  required: "Amount is required",
                  validate: (v) => parseFloat(v) > 0 || "Amount must be greater than 0",
                })}
                className={styles.amountInput}
                placeholder="0.00"
                inputMode="decimal"
                autoComplete="off"
                onChange={(e) => {
                  const formatted = formatAmount(e.target.value);
                  e.target.value = formatted;
                  register("amount").onChange(e);
                }}
              />
            </div>

            {errors.amount && (
              <span className={styles.error}>{errors.amount.message}</span>
            )}
          </div>

          <div className={styles.fields}>
            {/* Description */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Description</label>
              <input
                {...register("description")}
                className={styles.input}
                placeholder="Add description..."
                autoComplete="off"
              />
            </div>

            {/* Category + Date */}
            <div className={styles.row}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Category</label>
                <div className={styles.selectWrapper}>
                  <select {...register("category")} className={styles.select}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <span className={styles.selectChevron}>▾</span>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Date</label>
                <div className={styles.dateWrapper}>
                  <input
                    {...register("date")}
                    type="date"
                    className={styles.dateInput}
                    defaultValue={todayStr}
                  />
                  <span className={styles.calIcon}>📅</span>
                </div>
              </div>
            </div>

            {/* Payment Account */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Payment Account</label>
              <div className={styles.selectWrapper}>
                <select {...register("paymentAccount")} className={styles.select}>
                  {PAYMENT_ACCOUNTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <span className={styles.selectChevron}>▾</span>
              </div>
            </div>

            {/* Paid By */}
            <div className={styles.fieldGroup}>
              <div className={styles.paidByHeader}>
                <label className={styles.label}>Paid by</label>
                <button type="button" className={styles.selectAll}>
                  Select All
                </button>
              </div>
              <Controller
                name="paidBy"
                control={control}
                render={({ field }) => (
                  <div className={styles.paidByRow}>
                    {(["Myself", "Other"] as Payer[]).map((payer) => {
                      const active = field.value.includes(payer);
                      return (
                        <button
                          key={payer}
                          type="button"
                          className={`${styles.paidByChip} ${active ? styles.chipActive : ""}`}
                          onClick={() => {
                            if (active) {
                              field.onChange(field.value.filter((p: string) => p !== payer));
                            } else {
                              field.onChange([...field.value, payer]);
                            }
                          }}
                        >
                          {payer === "Myself" && (
                            <span className={styles.avatar}>👤</span>
                          )}
                          {payer === "Other" && (
                            <span className={styles.avatarInfo}>ℹ</span>
                          )}
                          {payer}
                        </button>
                      );
                    })}
                    <button type="button" className={styles.addPayerBtn} aria-label="Add payer">
                      +
                    </button>
                  </div>
                )}
              />
            </div>

            {/* Additional Notes */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Additional Notes</label>
              <textarea
                {...register("additionalNotes")}
                className={styles.textarea}
                placeholder="Add any extra details here..."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={() => router.push("/")}>
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.confirmBtn} ${submitting ? styles.submitting : ""} ${submitted ? styles.success : ""}`}
              disabled={submitting || submitted}
            >
              {submitted ? (
                <span className={styles.successInner}>✓ Saved!</span>
              ) : submitting ? (
                <span className={styles.loadingInner}>
                  <span className={styles.spinner} />
                  Saving...
                </span>
              ) : (
                "Confirm Entry"
              )}
            </button>
          </div>
        </form>

        {/* Submitting overlay */}
        {submitting && (
          <div className={styles.postOverlay}>
            <div className={styles.postCard}>
              <div className={styles.postSpinner} />
              <p className={styles.postText}>Posting to database…</p>
              <div className={styles.postBar}>
                <div className={styles.postBarFill} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
