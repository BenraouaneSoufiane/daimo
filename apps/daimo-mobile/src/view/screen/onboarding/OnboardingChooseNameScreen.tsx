import { validateName } from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { OnboardingHeader, getNumOnboardingSteps } from "./OnboardingHeader";
import VidUsernameAnimation from "../../../../assets/onboarding/username-animation.mp4";
import {
  ParamListOnboarding,
  useExitBack,
  useOnboardingNav,
} from "../../../common/nav";
import {
  getAccountManager,
  useDaimoChain,
} from "../../../logic/accountManager";
import { generateRandomName } from "../../../logic/name";
import { getRpcHook } from "../../../logic/trpc";
import { ButtonBig, TextButton } from "../../shared/Button";
import { CoverVideo } from "../../shared/CoverGraphic";
import { InputBig, OctName } from "../../shared/InputBig";
import Spacer from "../../shared/Spacer";
import image from "../../shared/image";
import { color, ss } from "../../shared/style";
import {
  TextBody,
  TextBodyMedium,
  TextBtnCaps,
  TextCenter,
} from "../../shared/text";

type Props = NativeStackScreenProps<ParamListOnboarding, "CreateChooseName">;
export function OnboardingChooseNameScreen({ route }: Props) {
  const daimoChain = useDaimoChain();
  const [name, setName] = useState("");
  const { inviteLink } = route.params;

  const nav = useOnboardingNav();
  const createAccount = useCallback(async () => {
    // Kick off account creation in background
    getAccountManager().createAccount(name, inviteLink);
    // Request notifications permission, hiding latency
    nav.navigate("AllowNotifs", { showProgressBar: true });
  }, [inviteLink, name]);

  // Show progress bar
  const steps = getNumOnboardingSteps();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View>
        <OnboardingHeader
          title="Choose Username"
          onPrev={useExitBack()}
          steps={steps}
          activeStep={steps - 2}
        />
        <Spacer h={24} />
        <View style={ss.container.padH24}>
          <CoverVideo video={VidUsernameAnimation} />
          <Spacer h={12} />
          <Instructions />
          <Spacer h={24} />
          <View style={styles.namePickerWrap}>
            <NamePicker
              name={name}
              daimoChain={daimoChain}
              onChange={setName}
              onChoose={createAccount}
            />
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

function Instructions() {
  return (
    <TextCenter>
      <TextBodyMedium color={color.grayMid}>
        Choose a username you'll go by on Daimo. Your username is public.
      </TextBodyMedium>
    </TextCenter>
  );
}

function IconRow(props: { icon?: OctName; color?: string; title: string }) {
  const { icon, title } = props;
  const col = props.color || color.grayMid;
  return (
    <View style={styles.iconRow}>
      {icon && <Octicons {...{ name: icon, size: 20, color: col }} />}
      <TextBody color={col}>{title}</TextBody>
    </View>
  );
}

function NamePicker({
  name,
  daimoChain,
  onChange,
  onChoose,
}: {
  name: string;
  daimoChain: DaimoChain;
  onChange: (name: string) => void;
  onChoose: () => void;
}) {
  // First, validate the name & check if it's available
  let error = "";
  try {
    validateName(name);
  } catch (e: any) {
    error = e.message;
  }
  const rpcHook = getRpcHook(daimoChain);
  const result = rpcHook.resolveName.useQuery({ name }, { enabled: !error });

  // Let user pick a random name
  const generateRandom = () => onChange(generateRandomName());

  // Don't flash status changes while typing
  const [debounce, setDebounce] = useState(false);
  useEffect(() => {
    setDebounce(true);
    const t = setTimeout(() => setDebounce(false), 500);
    return () => clearTimeout(t);
  }, [name]);

  let isAvailable = false;
  const status = (function () {
    if (name.length === 0) {
      return (
        <TextButton onPress={generateRandom}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={{ uri: image.iconSwitcheroo }}
              style={{ width: 16, height: 16, zIndex: -1 }}
            />
            <Spacer w={8} />
            <TextBtnCaps color={color.primary}>GENERATE RANDOM</TextBtnCaps>
          </View>
        </TextButton>
      );
    } else if (debounce) {
      return <Spacer h={40} />;
    } else if (error) {
      return <IconRow icon="alert" title={error.toLowerCase()} />;
    } else if (result.isLoading) {
      return <IconRow color={color.grayMid} title="..." />;
    } else if (result.error) {
      return <IconRow icon="alert" title="offline?" />;
    } else if (result.isSuccess && result.data) {
      return <IconRow icon="alert" title="sorry, that name is taken" />;
    } else if (result.isSuccess && result.data === null) {
      isAvailable = true;
      return (
        <IconRow
          icon="check-circle"
          color={color.successDark}
          title="available"
        />
      );
    }
    throw new Error("unreachable");
  })();

  return (
    <View>
      <InputBig
        placeholder="choose a username"
        value={name}
        onChange={(input) => onChange(input.toLowerCase())}
        center
        autoFocus
      />
      <Spacer h={8} />
      {status}
      <Spacer h={24} />
      <ButtonBig
        type="primary"
        title="CREATE ACCOUNT"
        onPress={onChoose}
        disabled={!isAvailable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  namePickerWrap: {
    height: 168,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
  },
});
