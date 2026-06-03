import axios from "axios";
import Cropper, { type Area, type Point } from "react-easy-crop";
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import toast from "react-hot-toast";
import {
  GoCheckCircle,
  GoKey,
  GoPencil,
  GoPerson,
  GoUpload,
  GoXCircle
} from "react-icons/go";

import Sidebar from "../components/Sidebar";
import SidebarBolsista from "../components/SidebarBolsista";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface Perfil {
  nome: string;
  email: string;
  tipoUsuario: string;
  unidade: string;
  cursoFaculdade: string;
  cargaHorariaSemanal: number | null;
  fotoBase64?: string | null;
}

function mensagemErro(error: unknown, fallback: string) {
  if (
    axios.isAxiosError(error) &&
    typeof error.response?.data === "string"
  ) {
    return error.response.data;
  }
  return fallback;
}

function criarImagem(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.src = url;
  });
}

async function recortarImagem(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const imagem = await criarImagem(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    imagem,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas vazio"))),
      "image/jpeg",
      0.92
    );
  });
}

export default function PerfilBolsista() {
  const { tipoUsuario: tipoUsuarioLocal } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  const [imagemParaCrop, setImagemParaCrop] = useState<string | null>(null);
  const [modalCrop, setModalCrop] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const inputFotoRef = useRef<HTMLInputElement>(null);

  const tipoUsuario = perfil?.tipoUsuario || tipoUsuarioLocal || "";
  const isBolsista = tipoUsuario === "Bolsista";

  const onCropComplete = useCallback(
    (_: Area, areaPixels: Area) => setCroppedAreaPixels(areaPixels),
    []
  );

  function fecharModalCrop() {
    setModalCrop(false);
    if (imagemParaCrop) URL.revokeObjectURL(imagemParaCrop);
    setImagemParaCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (inputFotoRef.current) inputFotoRef.current.value = "";
  }

  function selecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setImagemParaCrop(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setModalCrop(true);
  }

  async function confirmarFoto() {
    if (!imagemParaCrop || !croppedAreaPixels) return;
    setEnviandoFoto(true);
    try {
      const blob = await recortarImagem(imagemParaCrop, croppedAreaPixels);
      const arquivo = new File([blob], "foto-perfil.jpg", {
        type: "image/jpeg"
      });
      const formData = new FormData();
      formData.append("foto", arquivo);
      const response = await api.post("/auth/foto-perfil", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setPerfil((prev) =>
        prev ? { ...prev, fotoBase64: response.data.fotoBase64 } : prev
      );
      toast.success("Foto atualizada com sucesso");
      fecharModalCrop();
    } catch (error) {
      toast.error(mensagemErro(error, "Erro ao enviar foto"));
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function carregarPerfil() {
    try {
      const response = await api.get("/auth/perfil");
      setPerfil(response.data);
      setNome(response.data.nome);
      setEmail(response.data.email);
    } catch (error) {
      toast.error(mensagemErro(error, "Erro ao carregar perfil"));
    }
  }

  async function salvarPerfil(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvandoPerfil(true);
    try {
      const response = await api.put("/auth/perfil", { nome, email });
      localStorage.setItem("nome", response.data.nome);
      setPerfil((perfilAtual) =>
        perfilAtual
          ? { ...perfilAtual, nome: response.data.nome, email: response.data.email }
          : perfilAtual
      );
      toast.success("Perfil atualizado");
    } catch (error) {
      toast.error(mensagemErro(error, "Erro ao atualizar perfil"));
    } finally {
      setSalvandoPerfil(false);
    }
  }

  async function alterarSenha(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (novaSenha !== confirmacaoSenha) {
      toast.error("A confirmação não confere com a nova senha");
      return;
    }
    setSalvandoSenha(true);
    try {
      await api.put("/auth/alterar-senha", { senhaAtual, novaSenha });
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacaoSenha("");
      toast.success("Senha alterada com sucesso");
    } catch (error) {
      toast.error(mensagemErro(error, "Erro ao alterar senha"));
    } finally {
      setSalvandoSenha(false);
    }
  }

  useEffect(() => {
    carregarPerfil();
  }, []);

  return (
    <div className="app-shell">
      {isBolsista ? <SidebarBolsista /> : <Sidebar />}

      <main className="app-main">
        <div className="page-heading">
          <div>
            <p className="page-kicker">Perfil</p>
            <h1 className="page-title">Dados da Conta</h1>
            <p className="page-subtitle">
              Mantenha seus dados de acesso atualizados.
            </p>
          </div>

          <span className="status-pill status-muted">
            <GoPerson aria-hidden="true" />
            {tipoUsuario || "Usuario"}
          </span>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="metric-card">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Nome
            </p>
            <strong className="mt-3 block text-xl text-slate-900">
              {perfil?.nome || "-"}
            </strong>
          </div>

          <div className="metric-card">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Email
            </p>
            <strong className="mt-3 block break-all text-xl text-slate-900">
              {perfil?.email || "-"}
            </strong>
          </div>

          <div className="metric-card">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Acesso
            </p>
            <strong className="mt-3 block text-xl text-teal-800">
              {tipoUsuario || "-"}
            </strong>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="panel">
            <h2 className="text-2xl font-bold text-slate-900">
              Informações pessoais
            </h2>
            <p className="mb-6 mt-1 text-sm text-slate-500">
              Estes dados aparecem na identificação do usuario.
            </p>

            <div className="mb-6 flex flex-col items-center gap-3">
              <div className="profile-photo-wrapper">
                {perfil?.fotoBase64 ? (
                  <img
                    src={perfil.fotoBase64}
                    alt="Foto de perfil"
                    className="profile-photo-img"
                  />
                ) : (
                  <span className="profile-photo-initials">
                    {perfil?.nome?.charAt(0).toUpperCase() ?? "?"}
                  </span>
                )}

                <button
                  type="button"
                  className="profile-photo-overlay"
                  onClick={() => inputFotoRef.current?.click()}
                  title="Alterar foto"
                >
                  <GoUpload aria-hidden="true" />
                </button>
              </div>

              <input
                ref={inputFotoRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={selecionarFoto}
              />

              <button
                type="button"
                className="quiet-button min-h-0 px-3 py-2 text-sm"
                onClick={() => inputFotoRef.current?.click()}
              >
                <GoUpload aria-hidden="true" />
                Alterar foto
              </button>
            </div>

            <form onSubmit={salvarPerfil}>
              <label className="field-label">Nome</label>
              <input
                type="text"
                className="field mb-4"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />

              <label className="field-label">Email</label>
              <input
                type="email"
                autoComplete="username"
                className="field mb-6"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <button
                disabled={salvandoPerfil}
                className="primary-button w-full"
              >
                <GoPencil aria-hidden="true" />
                {salvandoPerfil ? "Salvando..." : "Salvar dados"}
              </button>
            </form>
          </section>

          <section className="panel">
            <h2 className="text-2xl font-bold text-slate-900">Segurança</h2>
            <p className="mb-6 mt-1 text-sm text-slate-500">
              Atualize sua senha periodicamente.
            </p>

            <form onSubmit={alterarSenha}>
              <label className="field-label">Senha Atual</label>
              <input
                type="password"
                autoComplete="current-password"
                className="field mb-4"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
              />

              <label className="field-label">Nova Senha</label>
              <input
                type="password"
                autoComplete="new-password"
                className="field mb-4"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />

              <label className="field-label">Confirmar nova senha</label>
              <input
                type="password"
                autoComplete="new-password"
                className="field mb-6"
                value={confirmacaoSenha}
                onChange={(e) => setConfirmacaoSenha(e.target.value)}
              />

              <button
                disabled={salvandoSenha}
                className="secondary-button w-full"
              >
                <GoKey aria-hidden="true" />
                {salvandoSenha ? "Alterando..." : "Alterar senha"}
              </button>
            </form>
          </section>
        </div>

        {isBolsista && (
          <section className="panel mt-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Dados Acadêmicos
                </h2>
                <p className="text-sm text-slate-500">
                  Informações usadas nos relatórios individuais de ponto.
                </p>
              </div>

              <span className="status-pill status-muted">
                <GoCheckCircle aria-hidden="true" />
                Definido no Cadastro
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="field-label">Curso</label>
                <input
                  disabled
                  className="field"
                  value={perfil?.cursoFaculdade || ""}
                  readOnly
                />
              </div>

              <div>
                <label className="field-label">Unidade/Orgão</label>
                <input
                  disabled
                  className="field"
                  value={perfil?.unidade || ""}
                  readOnly
                />
              </div>

              <div>
                <label className="field-label">Carga horária semanal</label>
                <input
                  disabled
                  className="field"
                  value={
                    perfil?.cargaHorariaSemanal
                      ? `${perfil.cargaHorariaSemanal}h`
                      : ""
                  }
                  readOnly
                />
              </div>
            </div>
          </section>
        )}
      </main>

      {modalCrop && imagemParaCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="panel w-full max-w-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Ajustar foto
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Arraste para reposicionar e use o controle de zoom.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModalCrop}
                className="secondary-button min-h-0 p-2"
                title="Fechar"
              >
                <GoXCircle aria-hidden="true" />
              </button>
            </div>

            <div className="crop-container">
              <Cropper
                image={imagemParaCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="mt-4">
              <label className="field-label flex items-center justify-between">
                <span>Zoom</span>
                <span className="text-xs font-normal text-slate-400">
                  {zoom.toFixed(1)}×
                </span>
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="crop-zoom-slider"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={fecharModalCrop}
                className="secondary-button"
              >
                <GoXCircle aria-hidden="true" />
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarFoto}
                disabled={enviandoFoto}
                className="primary-button"
              >
                <GoCheckCircle aria-hidden="true" />
                {enviandoFoto ? "Enviando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
