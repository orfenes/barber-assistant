
import { availableTimes, services, type ServiceId } from "../data/services";

export type Step =
  | "menu"
  | "services"
  | "date"
  | "time"
  | "confirmation"
  | "human";

export type Conversation = {
  step: Step;
  service?: (typeof services)[ServiceId];
  date?: string;
  time?: string;
};

export type Appointment = {
  phone: string;
  service: string;
  price: number;
  date: string;
  time: string;
  status: "confirmed";
};

const conversations = new Map<string, Conversation>();
const appointments: Appointment[] = [];

function getConversation(phone: string): Conversation {
  let conversation = conversations.get(phone);

  if (!conversation) {
    conversation = { step: "menu" };
    conversations.set(phone, conversation);
  }

  return conversation;
}

function isValidDate(date: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    return false;
  }

  const [day, month, year] = date.split("/").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  );
}

function isPastDate(date: string): boolean {
  const [day, month, year] = date.split("/").map(Number);
  const selectedDate = new Date(year, month - 1, day);
  const today = new Date();

  selectedDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return selectedDate < today;
}

function getAvailableTimes(date: string) {
  const bookedTimes = new Set(
    appointments
      .filter(
        (appointment) =>
          appointment.date === date &&
          appointment.status === "confirmed",
      )
      .map((appointment) => appointment.time),
  );

  return Object.entries(availableTimes).filter(
    ([, time]) => !bookedTimes.has(time),
  );
}

function formatTimes(times: [string, string][]) {
  return times.map(([id, time]) => `${id} - ${time}`).join("\n");
}

function showMenu(conversation: Conversation) {
  conversation.step = "menu";
  conversation.service = undefined;
  conversation.date = undefined;
  conversation.time = undefined;

  return {
    reply:
      "Olá! Bem-vindo à Barbearia 💈\n\n" +
      "1 - Agendar horário\n" +
      "2 - Ver serviços\n" +
      "3 - Falar com atendente",
  };
}

function showServices() {
  return {
    reply:
      "Nossos serviços 💈\n\n" +
      Object.values(services)
        .map((service) => `${service.name} - R$ ${service.price}`)
        .join("\n") +
      "\n\nDigite 'oi' para voltar ao menu.",
  };
}

function handleMenu(message: string, conversation: Conversation) {
  if (message === "1") {
    conversation.step = "services";

    return {
      reply:
        "Qual serviço deseja?\n\n" +
        Object.entries(services)
          .map(
            ([id, service]) =>
              `${id} - ${service.name} (R$ ${service.price})`,
          )
          .join("\n"),
    };
  }

  if (message === "2") {
    return showServices();
  }

  if (message === "3") {
    conversation.step = "human";
    return {
      reply: "Um atendente poderá continuar seu atendimento.",
    };
  }

  return { reply: "Opção inválida. Digite 1, 2 ou 3." };
}

function handleService(message: string, conversation: Conversation) {
  if (!Object.hasOwn(services, message)) {
    return { reply: "Opção inválida. Escolha um serviço de 1 a 3." };
  }

  conversation.service = services[message as ServiceId];
  conversation.step = "date";

  return {
    reply:
      `Você escolheu: ${conversation.service.name} — R$ ${conversation.service.price}\n\n` +
      "Qual dia deseja agendar? Informe no formato DD/MM/AAAA.",
  };
}

function handleDate(message: string, conversation: Conversation) {
  if (!isValidDate(message)) {
    return {
      reply: "Data inválida. Informe uma data real no formato DD/MM/AAAA.",
    };
  }

  if (isPastDate(message)) {
    return {
      reply: "Essa data já passou. Informe uma data futura.",
    };
  }

  const times = getAvailableTimes(message);

  if (times.length === 0) {
    return {
      reply:
        "Não temos horários disponíveis para essa data.\n\n" +
        "Informe outra data no formato DD/MM/AAAA.",
    };
  }

  conversation.date = message;
  conversation.time = undefined;
  conversation.step = "time";

  return {
    reply:
      `Data selecionada: ${message}\n\n` +
      "Horários disponíveis:\n\n" +
      formatTimes(times as [string, string][]),
  };
}

function handleTime(message: string, conversation: Conversation) {
  if (!conversation.date) {
    conversation.step = "date";
    return { reply: "Informe novamente a data no formato DD/MM/AAAA." };
  }

  const times = getAvailableTimes(conversation.date);
  const selectedTime = times.find(([id]) => id === message)?.[1];

  if (!selectedTime) {
    return {
      reply:
        "Esse horário não está disponível.\n\n" +
        "Escolha uma das opções:\n\n" +
        formatTimes(times as [string, string][]),
    };
  }

  conversation.time = selectedTime;
  conversation.step = "confirmation";

  return {
    reply:
      `Serviço: ${conversation.service?.name}\n` +
      `Data: ${conversation.date}\n` +
      `Horário: ${conversation.time}\n\n` +
      "Deseja confirmar o agendamento?\n\n" +
      "1 - Sim\n" +
      "2 - Não",
  };
}

function handleConfirmation(
  message: string,
  phone: string,
  conversation: Conversation,
) {
  if (message === "2") {
    conversations.delete(phone);

    return {
      reply: "Agendamento cancelado. Digite 'oi' para voltar ao menu.",
    };
  }

  if (message !== "1") {
    return {
      reply: "Opção inválida. Digite 1 para confirmar ou 2 para cancelar.",
    };
  }

  if (!conversation.service || !conversation.date || !conversation.time) {
    conversations.delete(phone);

    return {
      reply: "Não foi possível recuperar os dados. Digite 'oi' para recomeçar.",
    };
  }

  // Confere novamente para evitar reservar um horário ocupado durante a conversa.
  const alreadyBooked = appointments.some(
    (appointment) =>
      appointment.date === conversation.date &&
      appointment.time === conversation.time &&
      appointment.status === "confirmed",
  );

  if (alreadyBooked) {
    conversation.step = "time";
    conversation.time = undefined;

    const times = getAvailableTimes(conversation.date);

    return {
      reply:
        "Esse horário acabou de ser reservado por outra pessoa.\n\n" +
        (times.length > 0
          ? "Escolha outro horário:\n\n" +
            formatTimes(times as [string, string][])
          : "Não restam horários nessa data. Informe outra data no formato DD/MM/AAAA."),
    };
  }

  const appointment: Appointment = {
    phone,
    service: conversation.service.name,
    price: conversation.service.price,
    date: conversation.date,
    time: conversation.time,
    status: "confirmed",
  };

  appointments.push(appointment);
  conversations.delete(phone);

  return {
    reply:
      "Agendamento confirmado! 💈\n\n" +
      `Serviço: ${appointment.service}\n` +
      `Valor: R$ ${appointment.price}\n` +
      `Data: ${appointment.date}\n` +
      `Horário: ${appointment.time}\n\n` +
      "Obrigado pela preferência!",
  };
}

export function handleMessage(phone: string, message: string) {
  if (["oi", "olá", "ola", "menu"].includes(message)) {
    return showMenu(getConversation(phone));
  }

  const conversation = getConversation(phone);

  switch (conversation.step) {
    case "menu":
      return handleMenu(message, conversation);

    case "services":
      return handleService(message, conversation);

    case "date":
      return handleDate(message, conversation);

    case "time":
      return handleTime(message, conversation);

    case "confirmation":
      return handleConfirmation(message, phone, conversation);

    case "human":
      return {
        reply: "Seu atendimento aguarda um atendente. Digite 'oi' para voltar ao menu.",
      };
  }
}
