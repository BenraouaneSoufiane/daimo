import {
  DaimoInviteStatus,
  DaimoLinkInvite,
  DaimoLinkNoteV2,
  DaimoNoteState,
  DaimoNoteStatus,
  EAccount,
  formatDaimoLink,
  getEAccountStr,
} from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Linking, View, StyleSheet } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import { getInvitePasteLink } from "../../../logic/invite";
import { useFetchLinkStatus } from "../../../logic/linkStatus";
import { ButtonBig, TextButton } from "../../shared/Button";
import { InputBig, OctName } from "../../shared/InputBig";
import { IntroTextParagraph } from "../../shared/IntroTextParagraph";
import Spacer from "../../shared/Spacer";
import { color } from "../../shared/style";
import { TextCenter, TextH1, TextLight } from "../../shared/text";

export function InvitePage({
  onNext,
  onPrev,
  daimoChain,
  inviteLink,
  setInviteLink,
}: {
  onNext: ({ isTestnet }: { isTestnet: boolean }) => void;
  onPrev?: () => void;
  daimoChain: DaimoChain;
  inviteLink: DaimoLinkInvite | DaimoLinkNoteV2 | undefined;
  setInviteLink: (
    inviteLink: DaimoLinkInvite | DaimoLinkNoteV2 | undefined
  ) => void;
}) {
  // Handle invite links from deep link opens.
  const [text, setText] = useState(
    inviteLink ? formatDaimoLink(inviteLink) : ""
  );
  const [isValid, setIsValid] = useState(!!inviteLink);
  const [sender, setSender] = useState<EAccount | undefined>(undefined);

  // HACK: Workaround for testnet to never query API
  const isTestnet = text === "testnet";
  useEffect(() => {
    if (isTestnet) setIsValid(true);
  }, [isTestnet]);

  const hasNotStartedTyping = text === "" && !isValid;

  const onChange = (newText: string) => {
    setInviteLink(getInvitePasteLink(newText));
    setText(newText);
  };

  // We haven't picked a daimoChain yet so this defaults to prod.
  const linkStatus = useFetchLinkStatus(inviteLink, daimoChain);

  useEffect(() => {
    if (!linkStatus || linkStatus.data == null) return;

    if (linkStatus.data.link.type === "notev2") {
      const noteStatus = linkStatus.data as DaimoNoteStatus;
      setIsValid(noteStatus.status === DaimoNoteState.Confirmed);
      setSender(noteStatus.sender);
    } else if (linkStatus.data.link.type === "invite") {
      const inviteStatus = linkStatus.data as DaimoInviteStatus;
      setIsValid(inviteStatus.isValid);
      setSender(undefined); // TODO: Add senders to invite codes
    } else {
      setIsValid(false);
      setSender(undefined);
    }
  }, [linkStatus]);

  const oct = (name: OctName, color?: string) => (
    <Octicons {...{ name, color }} size={14} />
  );
  const status = (function () {
    if (!linkStatus || hasNotStartedTyping) {
      return " ";
    } else if (linkStatus.data == null) {
      return "...";
    } else if (isValid) {
      return (
        <>
          {oct("check-circle", color.successDark)} valid
          {isTestnet ? " testnet " : " "}invite
          {sender && ` from ${getEAccountStr(sender)}`}
        </>
      );
    } else {
      return <>{oct("alert")} invalid invite</>;
    }
  })();

  const linkToWaitlist = () => {
    const url = `https://daimo.com/waitlist`;
    Linking.openURL(url);
  };

  const fetchClipboard = async () => {
    const pasteText = await Clipboard.getStringAsync();
    if (pasteText) onChange(pasteText);
  };

  useEffect(() => {
    if (!inviteLink) return;

    if (inviteLink.type === "notev2") {
      // shorten displayed link from cleaned up url
      setText(formatDaimoLink(inviteLink));
    } else {
      setText(inviteLink.code);
    }
  }, [inviteLink]);

  return (
    <View>
      <OnboardingHeader title="Invite" onPrev={onPrev} />
      <View style={styles.paddedPage}>
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <Octicons name="mail" size={40} color={color.midnight} />
        </View>
        <Spacer h={32} />
        <TextCenter>
          <IntroTextParagraph>
            Daimo is currently invite-only. Paste your invite code below or open
            it from browser. Don't have one? Join the waitlist.
          </IntroTextParagraph>
        </TextCenter>
        <Spacer h={32} />
        <TextCenter>
          <TextH1>
            <TextLight>{status}</TextLight>
          </TextH1>
        </TextCenter>
        <Spacer h={16} />
        <InputBig
          placeholder="enter invite code"
          value={text}
          onChange={onChange}
          center={text.length < 12} // Workaround for Android centering bug
        />
        <Spacer h={16} />
        {hasNotStartedTyping ? (
          <>
            <TextCenter>
              <TextLight>or</TextLight>
            </TextCenter>
            <Spacer h={16} />
            <ButtonBig
              type="primary"
              title="Paste invite from browser"
              onPress={fetchClipboard}
            />
          </>
        ) : (
          <>
            <Spacer h={36} />
            <ButtonBig
              type="primary"
              title="Submit"
              onPress={() => onNext({ isTestnet })}
              disabled={!isValid}
            />
          </>
        )}
        <Spacer h={16} />
        <TextButton title="Join waitlist" onPress={linkToWaitlist} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paddedPage: {
    paddingTop: 64,
    paddingHorizontal: 24,
  },
});
