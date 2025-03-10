interface PasswordCredentialData {
  id: string;
  password: string;
  name?: string;
  iconURL?: string;
}

declare class PasswordCredential implements Credential {
  constructor(data: PasswordCredentialData);
  readonly id: string;
  readonly name?: string;
  readonly iconURL?: string;
  readonly type: string;
}

interface CredentialRequestOptions {
  mediation?: CredentialMediationRequirement;
  signal?: AbortSignal;
  publicKey?: PublicKeyCredentialRequestOptions;
  federated?: FederatedCredentialRequestOptions;
  password?: boolean;  // Adding password option
}

interface FederatedCredentialRequestOptions {
  providers: string[];
  protocols?: string[];
}

interface PublicKeyCredentialRequestOptions {
  challenge: BufferSource;
  timeout?: number;
  rpId?: string;
  allowCredentials?: PublicKeyCredentialDescriptor[];
  userVerification?: UserVerificationRequirement;
  extensions?: AuthenticationExtensionsClientInputs;
}

type UserVerificationRequirement = "required" | "preferred" | "discouraged";

interface PublicKeyCredentialDescriptor {
  type: "public-key";
  id: BufferSource;
  transports?: AuthenticatorTransport[];
}