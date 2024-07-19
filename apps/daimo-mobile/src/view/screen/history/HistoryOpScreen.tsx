import {
  DaimoLinkNoteV2,
  DaimoNoteState,
  DaimoNoteStatus,
  TransferClog,
  OpStatus,
  PaymentLinkClog,
  amountToDollars,
  getAccountName,
  getDisplayFromTo,
  getSynthesizedMemo,
} from "@daimo/common";
import { ChainConfig, daimoChainFromId } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { TouchableOpacity } from "@gorhom/bottom-sheet";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { createContext, useCallback, useContext } from "react";
import { Linking, View } from "react-native";
import { Address } from "viem";

import { Dispatcher, DispatcherContext } from "../../../action/dispatch";
import {
  ParamListBottomSheet,
  navToAccountPage,
  useNav,
} from "../../../common/nav";
import { env } from "../../../env";
import { TranslationFunctions } from "../../../i18n/i18n-types";
import { getCachedEAccount } from "../../../logic/addr";
import { shareURL } from "../../../logic/externalAction";
import { useI18n } from "../../../logic/i18n";
import { useFetchLinkStatus } from "../../../logic/linkStatus";
import { Account } from "../../../storage/account";
import { syncFindSameOp } from "../../../sync/sync";
import { AccountRow } from "../../shared/AccountRow";
import { TitleAmount } from "../../shared/Amount";
import { ButtonBig } from "../../shared/Button";
import { CenterSpinner } from "../../shared/CenterSpinner";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { color, ss } from "../../shared/style";
import {
  TextBodyCaps,
  TextCenter,
  TextError,
  TextPara,
} from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";
import { NoteDisplay } from "../link/NoteScreen";

type Props = NativeStackScreenProps<
  ParamListBottomSheet,
  "BottomSheetHistoryOp"
>;

// Allows the HistoryOpScreen to change the bottom sheet snap point count.
// This allows the bottom sheet to be dismissed when the user exits the detail
// screen and only display the half screen snap point when the user is on the
// detail screen.
export const SetBottomSheetDetailHeight = createContext((height: number) => {});

export function HistoryOpScreen(props: Props) {
  const Inner = useWithAccount(HistoryOpScreenInner);
  return <Inner {...props} />;
}

function HistoryOpScreenInner({
  account,
  route,
}: Props & { account: Account }) {
  const i18n = useI18n();
  const setBottomSheetDetailHeight = useContext(SetBottomSheetDetailHeight);

  // Load the latest version of this op. If the user opens the detail screen
  // while the op is pending, and it confirms, the screen should update.
  // A pending op always has an opHash (since its initiated by the user's
  // account).
  const { opHash, txHash } = route.params.op;
  const foundOp = syncFindSameOp({ opHash, txHash }, account.recentTransfers);
  const op = foundOp || route.params.op;

  const { chainConfig } = env(daimoChainFromId(account.homeChainId));

  const nav = useNav();

  const leaveScreen = () => {
    if (nav.canGoBack()) {
      setBottomSheetDetailHeight(0);
      nav.goBack();
    }
  };

  const sentPaymentLink =
    op.type === "createLink" &&
    op.noteStatus.claimer == null &&
    account.sentPaymentLinks.find((p) => p.id === op.noteStatus.id);
  const shareLinkAgain = sentPaymentLink && (() => shareURL(sentPaymentLink));

  return (
    <View style={ss.container.padH16}>
      <ScreenHeader
        title={getOpVerb(op, account.address, i18n)}
        onExit={leaveScreen}
        hideOfflineHeader
      />
      <TransferBody account={account} op={op} />
      <Spacer h={36} />
      <View style={ss.container.padH16}>
        {op.txHash && !shareLinkAgain && (
          <LinkToExplorer {...{ chainConfig }} op={op} />
        )}
        {shareLinkAgain && (
          <ButtonBig
            type="subtle"
            title={i18n.historyOp.shareLinkAgain()}
            onPress={shareLinkAgain}
          />
        )}
      </View>
      <Spacer h={16} />
      {op.type === "createLink" &&
        [OpStatus.confirmed, OpStatus.finalized].includes(op.status) && (
          <NoteView account={account} note={op} leaveScreen={leaveScreen} />
        )}
      {op.type === "createLink" && <Spacer h={16} />}
    </View>
  );
}

function NoteView({
  account,
  note,
  leaveScreen,
}: {
  account: Account;
  note: PaymentLinkClog;
  leaveScreen: () => void;
}) {
  const daimoChain = daimoChainFromId(account.homeChainId);
  // Strip seed from link
  const link: DaimoLinkNoteV2 = {
    type: "notev2",
    id: note.noteStatus!.id!,
    sender: getAccountName(note.noteStatus!.sender),
    dollars: amountToDollars(note.amount),
    seed: "",
  };
  const noteFetch = useFetchLinkStatus(link, daimoChain)!;
  const noteStatus = noteFetch.data as DaimoNoteStatus | undefined;

  return (
    <View>
      {noteFetch.isFetching && <CenterSpinner />}
      {noteFetch.error && <TextError>{noteFetch.error.message}</TextError>}
      {noteStatus && noteStatus.status === DaimoNoteState.Confirmed && (
        <NoteDisplay
          {...{ account, noteStatus }}
          hideAmount
          leaveScreen={leaveScreen}
        />
      )}
    </View>
  );
}

function LinkToExplorer({
  chainConfig,
  op,
}: {
  chainConfig: ChainConfig;
  op: TransferClog;
}) {
  const i18n = useI18n().historyOp;
  // Ethreceipts
  const chainId = chainConfig.chainL2.id;
  const { blockNumber, logIndex } = op;
  const url = `https://ethreceipts.org/l/${chainId}/${blockNumber}/${logIndex}`;

  const openURL = useCallback(() => Linking.openURL(url), [url]);

  return (
    <ButtonBig onPress={openURL} type="subtle" title={i18n.viewReceipt()} />
  );
}

function TransferBody({ account, op }: { account: Account; op: TransferClog }) {
  const nav = useNav();
  const i18n = useI18n();

  const sentByUs = op.from === account.address;
  const [displayFrom, displayTo] = getDisplayFromTo(op);
  const other = getCachedEAccount(sentByUs ? displayTo : displayFrom);

  const chainConfig = env(daimoChainFromId(account.homeChainId)).chainConfig;
  const coinName = chainConfig.tokenSymbol;
  const chainName = chainConfig.chainL2.name.toUpperCase();

  // Help button to explain fees, chain, etc
  const dispatcher = useContext(DispatcherContext);
  const onShowHelp = useCallback(
    () =>
      showHelpWhyNoFees(dispatcher, chainConfig.chainL2.name, coinName, i18n),
    []
  );

  // Generate subtitle = fees, chain, other details
  const col = color.grayMid;
  const subtitleElems = [
    <React.Fragment key="coin">{coinName}</React.Fragment>,
    <React.Fragment key="chain">{chainName}</React.Fragment>,
    <React.Fragment key="fees">
      <TextBodyCaps color={col}>{getFeeText(i18n, op.feeAmount)}</TextBodyCaps>
      <Spacer w={8} />
      <Octicons size={16} name="info" color={col} />
    </React.Fragment>,
  ];

  for (let i = subtitleElems.length - 1; i > 0; i--) {
    const spacerText = " • ";
    const space = <React.Fragment key={i}>{spacerText}</React.Fragment>;
    subtitleElems.splice(i, 0, space);
  }

  const memoText = getSynthesizedMemo(
    op,
    env(daimoChainFromId(account.homeChainId)).chainConfig
  );

  return (
    <View>
      <TitleAmount
        amount={BigInt(op.amount)}
        preSymbol={sentByUs ? "-" : "+"}
        style={sentByUs ? { color: "black" } : { color: color.success }}
      />
      <Spacer h={4} />
      <TouchableOpacity onPress={onShowHelp} hitSlop={8}>
        <TextCenter>
          <TextBodyCaps color={color.grayMid}>{subtitleElems}</TextBodyCaps>
        </TextCenter>
      </TouchableOpacity>
      {memoText && (
        <>
          <Spacer h={16} />
          <TextCenter>
            <TextBodyCaps color={color.grayMid}>{memoText}</TextBodyCaps>
          </TextCenter>
        </>
      )}
      <Spacer h={32} />
      <AccountRow
        acc={other}
        timestamp={op.timestamp}
        viewAccount={() => navToAccountPage(other, nav)}
        pending={op.status === "pending"}
      />
    </View>
  );
}

function getOpVerb(
  op: TransferClog,
  accountAddress: Address,
  _i18n: TranslationFunctions
) {
  const i18n = _i18n.historyOp.opVerb;
  const isPayLink = op.type === "createLink" || op.type === "claimLink";
  const sentByUs = op.from === accountAddress;
  const isRequestResponse = op.type === "transfer" && op.requestStatus != null;

  if (isPayLink) {
    if (sentByUs) return i18n.createdLink();
    const fromUs = op.noteStatus.sender.addr === accountAddress;
    return fromUs ? i18n.cancelledLink() : i18n.acceptedLink();
  } else if (isRequestResponse) {
    return sentByUs ? i18n.fulfilledRequest() : i18n.receivedRequest();
  } else {
    return sentByUs ? i18n.sent() : i18n.received();
  }
}

function showHelpWhyNoFees(
  dispatcher: Dispatcher,
  chainName: string,
  coinName: string,
  _i18n: TranslationFunctions
) {
  const i18n = _i18n.historyOp.whyNoFees;
  dispatcher.dispatch({
    name: "helpModal",
    title: i18n.title(),
    content: (
      <View style={ss.container.padH8}>
        <TextPara>{i18n.description.firstPara({ chainName })}</TextPara>
        <Spacer h={24} />
        <TextPara>{i18n.description.secondPara()}</TextPara>
        <Spacer h={24} />
        <TextPara>{i18n.description.thirdPara()}</TextPara>
      </View>
    ),
  });
}

function getFeeText(_i18n: TranslationFunctions, amount?: number) {
  const i18n = _i18n.historyOp.feeText;
  if (amount == null) {
    return i18n.pending();
  }

  let feeStr = "$" + amountToDollars(amount);
  if (amount > 0 && feeStr === "$0.00") {
    feeStr = "< $0.01";
  }
  return amount === 0
    ? i18n.free()
    : feeStr + " " + i18n.fee({ amount: feeStr });
}
