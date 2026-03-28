/**
 * DisclaimerGateWrapper — wraps children with the disclaimer gate.
 *
 * This is a thin wrapper around the existing DisclaimerGate component that
 * provides the gate stack pattern used in App.tsx:
 *
 *   <InviteGateWrapper>
 *     <BannedGate>
 *       <SiteLockGate>
 *         <Route path="/admin/...">...</Route>
 *         <Route>
 *           <DisclaimerGateWrapper>
 *             <AppRouter />
 *           </DisclaimerGateWrapper>
 *         </Route>
 *       </SiteLockGate>
 *     </BannedGate>
 *   </InviteGateWrapper>
 */
import { useDisclaimerGate } from "./DisclaimerGate";
import DisclaimerGate from "./DisclaimerGate";

interface DisclaimerGateWrapperProps {
  children: React.ReactNode;
}

export default function DisclaimerGateWrapper({
  children,
}: DisclaimerGateWrapperProps) {
  const { gateOpen, dbLoading, confirm } = useDisclaimerGate();

  if (dbLoading) return <>{children}</>;
  if (gateOpen) return <DisclaimerGate onConfirm={confirm} />;
  return <>{children}</>;
}
