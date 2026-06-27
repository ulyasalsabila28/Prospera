import ErrorMessage from "../components/ErrorMessage"; 
import TransactionForm from "../components/Transaction/TransactionForm";
import CartTable from "../components/Transaction/CartTable";
import HistorySection from "../components/Transaction/HistorySection";
import TransactionDetailModal from "../components/Transaction/TransactionDetailModal";
import { useTransactionLogic } from "../hooks/useTransactionLogic"; 
import { printReceipt, getTransactionTypeLabel } from "../utils/transactionHelpers"; // <-- Panggil fungsi print
import OvertimeAuthModal from "../components/Transaction/OvertimeAuthModal";

export default function Transaction() {
  const logic = useTransactionLogic();

  return (
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
          <div><h2>Transaction</h2></div>
        </div>

        {/* ERROR SERVER */}
        {logic.fetchError && (
          <div style={{ marginBottom: "16px" }}><ErrorMessage error={logic.fetchError} /></div>
        )}



        {/* KOMPONEN UI */}
        <TransactionForm {...logic} />
        <CartTable {...logic} />
        
        {/* Helper getTransactionTypeLabel dikirim ke bawah biar gak error */}
        <HistorySection {...logic} getTransactionTypeLabel={getTransactionTypeLabel} />
        <TransactionDetailModal {...logic} getTransactionTypeLabel={getTransactionTypeLabel} />
        
        <OvertimeAuthModal 
            isOpen={logic.overtimeModal.isOpen} 
            errorMsg={logic.overtimeModal.errorMsg} 
            onClose={() => logic.setOvertimeModal({ isOpen: false, errorMsg: '' })} 
            onSubmit={logic.submitOvertimeAuth} 
            isSubmitting={logic.saving} 
        />
      </div>
  );
}