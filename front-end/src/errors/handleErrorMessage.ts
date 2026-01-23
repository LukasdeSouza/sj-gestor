import { toast } from "react-toastify";

/**
 * Exibe uma lista de erros como toasts.
 * @param errors Um array de strings contendo as mensagens de erro.
 * @param options Opções adicionais para o toast (opcional).
 */
export function handleErrorMessages(errors: (string | { message: string, path?: string })[]) {

  if (!Array.isArray(errors)) {
    console.error("Erro: O parâmetro 'errors' deve ser um array.");
    return;
  }

  // Processa os erros
  errors.forEach((error) => {
    let errorMessage: string;

    if (typeof error === "string") {
      // Caso 1: Se for uma string simples
      errorMessage = error;

    } else if (error.message) {
      // Caso 2: Se for um objeto com a chave 'message'

      // Se houver 'path' (o nome do campo), inclua-o na mensagem
      if (error.path && typeof error.path === 'string') {
        const fieldName = error.path.split('.').pop() || "Campo"; // Pega o nome do campo (e.g., 'product_id')
        errorMessage = `${fieldName}: ${error.message}`;
        
      } else {
        // Se não tiver 'path', use apenas a mensagem
        errorMessage = error.message;
      }
    } else {
      // Caso 3: Erro desconhecido
      errorMessage = "Erro desconhecido";
    }

    // Exibe o toast
    toast.error(errorMessage, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  });
}