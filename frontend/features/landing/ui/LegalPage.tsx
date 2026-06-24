import logo from '@assets/logo-light-mode.svg'
import { Button } from '@/lib/ui/button'

type LegalShellProps = {
  title: string
  eyebrow: string
  description: string
  responsibleLabel: string
  children: React.ReactNode
}

const contactLinks = (
  <>
    <a href="mailto:easyrota0@gmail.com">easyrota0@gmail.com</a>,{' '}
    <a href="mailto:uninfra@gmail.com">uninfra@gmail.com</a>
  </>
)

function LegalShell({
  title,
  eyebrow,
  description,
  responsibleLabel,
  children,
}: LegalShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3 rounded-2xl text-foreground transition-colors hover:text-primary">
            <img src={logo} alt="EasyRota" className="h-10 w-10" />
            <div className="leading-none">
              <h1 className="font-heading text-lg font-semibold tracking-tight">
                <span className="text-primary">Easy</span>
                <span>Rota</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Sistema de gerenciamento de rotas
              </p>
            </div>
          </a>

          <Button asChild variant="outline" size="sm">
            <a href="/">Home</a>
          </Button>
        </div>
      </header>

      <main className="bg-background">
        <section className="border-b border-border bg-muted/30 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
                {eyebrow}
              </span>
              <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold leading-tight text-foreground md:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
                {description}
              </p>
            </div>

            <dl className="grid rounded-2xl border border-border bg-card text-sm text-card-foreground shadow-md ring-1 ring-foreground/5">
              <div className="border-b border-border p-4">
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Última atualização
                </dt>
                <dd className="mt-1">26 de Junho de 2026</dd>
              </div>
              <div className="border-b border-border p-4">
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Sistema
                </dt>
                <dd className="mt-1">EasyRota</dd>
              </div>
              <div className="border-b border-border p-4">
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {responsibleLabel}
                </dt>
                <dd className="mt-1">EasyRota / UNINFRA</dd>
              </div>
              <div className="p-4">
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Contato
                </dt>
                <dd className="mt-1 text-primary">{contactLinks}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <article className="prose mx-auto max-w-4xl rounded-2xl border border-border bg-card px-6 py-8 text-muted-foreground shadow-md ring-1 ring-foreground/5 md:px-10 md:py-12 [&_a]:font-semibold [&_a]:text-primary [&_h2]:mt-12 [&_h2]:border-l-4 [&_h2]:border-primary [&_h2]:bg-muted/60 [&_h2]:px-4 [&_h2]:py-3 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:text-foreground [&_h2:first-child]:mt-0 [&_h3]:mt-8 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-tight [&_h3]:text-foreground [&_li]:pl-1 [&_li]:text-[15px] [&_li]:leading-8 [&_li::marker]:text-primary [&_p]:my-4 [&_p]:text-[15px] [&_p]:leading-8 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:my-5 [&_ul]:grid [&_ul]:gap-3 [&_ul]:rounded-2xl [&_ul]:border [&_ul]:border-border [&_ul]:bg-muted/40 [&_ul]:py-4 [&_ul]:pl-7 [&_ul]:pr-5 md:[&_h2]:text-3xl">
            {children}
          </article>
        </section>
      </main>

      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <a href="/" className="font-heading text-lg font-semibold text-foreground">
              <span className="text-primary">Easy</span>Rota
            </a>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Plataforma de gestão de quórum para transporte intermunicipal universitário.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <a href="/termos-de-uso" className="text-muted-foreground transition-colors hover:text-primary">
              Termos de Uso
            </a>
            <a href="/politica-de-privacidade" className="text-muted-foreground transition-colors hover:text-primary">
              Privacidade
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export function TermsOfServicePage() {
  return (
    <LegalShell
      title="Termos de Uso do Usuário"
      eyebrow="Documento legal"
      description="Condições de acesso, responsabilidades e regras de uso para usuários da plataforma EasyRota."
      responsibleLabel="Responsável pelo sistema"
    >
      <h2>1. Aceitação dos termos</h2>
      <p>
        Ao acessar ou utilizar o EasyRota, o usuário declara que leu, compreendeu e
        concorda com estes Termos de Uso.
      </p>
      <p>Caso não concorde com as condições aqui descritas, o usuário não deverá utilizar o sistema.</p>

      <h2>2. Finalidade do sistema</h2>
      <p>
        O EasyRota é uma aplicação web destinada ao gerenciamento do transporte universitário,
        com foco na organização de viagens, reservas de vagas, controle de passageiros,
        check-in, comunicação de status das viagens e apoio à gestão administrativa pela UNINFRA.
      </p>
      <p>
        O sistema busca reduzir falhas de comunicação, melhorar a previsibilidade das viagens
        e facilitar o controle de vagas em ônibus universitários.
      </p>

      <h2>3. Usuários do sistema</h2>
      <p>O sistema pode ser utilizado pelos seguintes perfis:</p>
      <ul>
        <li>
          <strong>Estudantes</strong>, para consulta de viagens, solicitação de reserva,
          cancelamento, check-in e acompanhamento de status;
        </li>
        <li>
          <strong>Servidores</strong>, para consulta de viagens, reserva com prioridade,
          solicitação de convidados e acompanhamento de status;
        </li>
        <li>
          <strong>Motoristas</strong>, para visualização das viagens do dia e realização de
          check-in dos passageiros;
        </li>
        <li>
          <strong>Administradores/UNINFRA</strong>, para gerenciamento de usuários, ônibus,
          rotas, horários, viagens, ocorrências e validações necessárias.
        </li>
      </ul>
      <p>Cada perfil possui permissões próprias. O usuário não deve tentar acessar funcionalidades que não correspondam ao seu perfil.</p>

      <h2>4. Cadastro e autenticação</h2>
      <p>Para utilizar funcionalidades restritas, o usuário deverá realizar cadastro e autenticação no sistema.</p>
      <p>
        O cadastro poderá exigir informações como nome, e-mail, matrícula, vínculo institucional,
        senha e documentos necessários para validação do vínculo com a instituição.
      </p>
      <p>A UNINFRA ou o responsável administrativo poderá aprovar ou rejeitar cadastros, conforme as regras internas de validação.</p>
      <p>O usuário é responsável por manter suas credenciais em sigilo e por comunicar qualquer suspeita de uso indevido de sua conta.</p>

      <h2>5. Consulta de viagens</h2>
      <p>
        O usuário poderá consultar informações sobre ônibus, rotas, horários, lotação,
        vagas disponíveis, status da viagem e demais informações operacionais disponibilizadas pelo sistema.
      </p>
      <p>As informações exibidas dependem dos dados cadastrados e atualizados pelos responsáveis administrativos.</p>

      <h2>6. Reserva de vagas</h2>
      <p>O usuário poderá solicitar reserva em viagens disponíveis, observadas as regras do sistema.</p>
      <p>A reserva poderá depender de:</p>
      <ul>
        <li>disponibilidade de vagas;</li>
        <li>horário limite para reserva;</li>
        <li>prioridade entre perfis de usuário;</li>
        <li>existência de servidor na viagem, quando aplicável;</li>
        <li>regras de quórum;</li>
        <li>validação administrativa, quando necessária.</li>
      </ul>
      <p>
        A solicitação de reserva não garante, por si só, a realização da viagem. A viagem
        poderá ser confirmada, colocada em risco de cancelamento, cancelada, concluída ou
        alterada conforme as regras operacionais.
      </p>

      <h2>7. Prioridade de servidores</h2>
      <p>O sistema poderá aplicar prioridade para servidores, conforme regra de negócio definida para o transporte universitário.</p>
      <p>Estudantes poderão ter sua reserva registrada de acordo com a disponibilidade de vagas e com a prioridade aplicável aos servidores.</p>

      <h2>8. Cancelamento de reservas</h2>
      <p>O usuário poderá cancelar sua reserva dentro do prazo permitido pelo sistema.</p>
      <p>Cancelamentos fora do prazo poderão ser bloqueados, conforme regra operacional definida.</p>
      <p>O usuário deve cancelar a reserva caso saiba que não utilizará a vaga, contribuindo para a organização do transporte e para o uso adequado dos recursos disponíveis.</p>

      <h2>9. Quórum e status da viagem</h2>
      <p>O sistema poderá verificar automaticamente o quórum necessário para realização da viagem.</p>
      <p>A viagem poderá receber status como:</p>
      <ul>
        <li>confirmada;</li>
        <li>em risco de cancelamento;</li>
        <li>cancelada;</li>
        <li>em andamento;</li>
        <li>concluída.</li>
      </ul>
      <p>O usuário deverá acompanhar o status da viagem pelo sistema.</p>

      <h2>10. Check-in</h2>
      <p>O check-in poderá ser realizado por meio de código, QR Code ou outro mecanismo definido pelo sistema.</p>
      <p>O motorista ou responsável autorizado poderá validar a presença dos passageiros no momento da viagem.</p>
      <p>O usuário deve realizar o check-in quando solicitado. A ausência de check-in poderá ser interpretada como ausência na viagem.</p>

      <h2>11. Penalidades por ausência</h2>
      <p>Caso o usuário reserve uma vaga e não compareça à viagem, o sistema poderá aplicar penalidade conforme regra de negócio definida.</p>
      <p>A penalidade poderá reduzir a prioridade do usuário em reservas futuras ou gerar outra consequência administrativa prevista pela gestão do transporte.</p>

      <h2>12. Convidados</h2>
      <p>Servidores poderão cadastrar convidados quando essa funcionalidade estiver disponível e quando houver autorização ou regra institucional permitindo.</p>
      <p>O cadastro de convidados poderá exigir nome, CPF e vínculo com a reserva do servidor.</p>
      <p>O servidor que cadastrar convidado é responsável pela veracidade das informações fornecidas.</p>

      <h2>13. Ocorrências</h2>
      <p>Administradores poderão registrar ocorrências relacionadas a viagens, ônibus, rotas, horários, atrasos, cancelamentos ou outros eventos relevantes.</p>
      <p>Essas ocorrências poderão impactar a disponibilidade da viagem, o status do transporte ou a comunicação aos usuários.</p>

      <h2>14. Uso adequado do sistema</h2>
      <p>O usuário compromete-se a:</p>
      <ul>
        <li>fornecer informações verdadeiras e atualizadas;</li>
        <li>utilizar o sistema apenas para fins relacionados ao transporte universitário;</li>
        <li>não tentar acessar contas, dados ou funcionalidades de terceiros;</li>
        <li>não burlar regras de reserva, prioridade, check-in ou cancelamento;</li>
        <li>não inserir dados falsos, ofensivos ou fraudulentos;</li>
        <li>não prejudicar o funcionamento do sistema.</li>
      </ul>
      <p>O uso indevido poderá resultar em bloqueio de acesso, cancelamento de reservas ou outras medidas administrativas cabíveis.</p>

      <h2>15. Disponibilidade do sistema</h2>
      <p>O EasyRota poderá passar por manutenções, atualizações, correções ou indisponibilidades temporárias.</p>
      <p>A equipe responsável buscará manter o sistema disponível e funcional, mas não garante funcionamento ininterrupto em todos os momentos.</p>

      <h2>16. Limitações</h2>
      <p>O sistema depende da correta inserção e atualização das informações pelos usuários autorizados e administradores.</p>
      <p>O EasyRota não substitui decisões administrativas da UNINFRA ou da instituição responsável pelo transporte.</p>
      <p>Em caso de divergência entre o sistema e uma decisão administrativa oficial, a decisão da administração responsável prevalecerá.</p>

      <h2>17. Alterações nos termos</h2>
      <p>Estes Termos de Uso poderão ser atualizados para refletir mudanças no sistema, nas regras operacionais ou em exigências legais.</p>
      <p>Quando houver alterações relevantes, os usuários poderão ser informados pelo próprio sistema ou por canal institucional adequado.</p>

      <h2>18. Contato</h2>
      <p>Dúvidas, solicitações ou comunicações relacionadas ao uso do sistema deverão ser encaminhadas para:</p>
      <p>
        <strong>Contato:</strong> {contactLinks}
      </p>
      <p>
        <strong>Responsável:</strong> EasyRota / Uninfra
      </p>
    </LegalShell>
  )
}

export function PrivacyPolicyPage() {
  return (
    <LegalShell
      title="Política de Privacidade"
      eyebrow="Dados pessoais"
      description="Como o EasyRota coleta, utiliza, protege e limita o tratamento de dados pessoais dos usuários."
      responsibleLabel="Responsável pelo tratamento dos dados"
    >
      <h2>1. Objetivo desta política</h2>
      <p>
        Esta Política de Privacidade explica quais dados pessoais são coletados pelo EasyRota,
        por que esses dados são utilizados, como são protegidos e quais são os direitos dos usuários.
      </p>
      <p>O EasyRota não utiliza telemetria, rastreamento comportamental, ferramentas de análise de uso ou compartilhamento de dados com terceiros para fins comerciais.</p>
      <p>Os dados coletados são aqueles necessários ao funcionamento das funcionalidades previstas nos requisitos do sistema.</p>

      <h2>2. Dados coletados</h2>
      <p>O EasyRota poderá coletar e armazenar dados conforme o perfil e as ações do usuário.</p>

      <h3>2.1 Dados de cadastro e autenticação</h3>
      <p>Podem ser coletados dados como nome completo, e-mail, matrícula ou código institucional, senha, data de cadastro, último login, status da conta e informações de perfil de acesso. A senha deve ser armazenada de forma protegida, conforme boas práticas de segurança.</p>

      <h3>2.2 Dados de estudante</h3>
      <p>Podem ser coletados dados como identificação de estudante, matrícula, e-mail institucional, comprovante de matrícula quando exigido para validação, histórico de reservas, registros de check-in e eventuais penalidades por ausência, quando aplicável.</p>

      <h3>2.3 Dados de servidor</h3>
      <p>Podem ser coletados dados como identificação funcional, matrícula ou código de servidor, e-mail institucional, informações sobre reservas realizadas, convidados vinculados à reserva e registros de check-in.</p>

      <h3>2.4 Dados de motorista</h3>
      <p>Podem ser coletados dados relacionados ao motorista, como sua identificação, número da CNH, vínculo com viagens ou ônibus e registros das ações de check-in realizadas no sistema.</p>

      <h3>2.5 Dados de administrador</h3>
      <p>Podem ser coletados dados relacionados à identificação do administrador, incluindo seu e-mail, perfil de permissão, nível de acesso e os registros administrativos realizados no sistema.</p>

      <h3>2.6 Dados de convidados</h3>
      <p>Quando houver cadastro de convidados, o sistema poderá coletar informações como nome completo, CPF, vínculo com o servidor responsável e a reserva ou viagem associada.</p>

      <h3>2.7 Dados de reservas, viagens e check-in</h3>
      <p>Podem ser coletados dados relacionados à viagem selecionada, incluindo a rota, a data e o horário, bem como o status da reserva e o status da viagem. Também podem ser registrados a posição do usuário em lista de espera, a realização do check-in, a data e o horário em que esse check-in ocorreu, além de informações sobre eventual ausência na viagem e a penalidade vinculada a essa ausência, quando aplicável.</p>

      <h3>2.8 Dados administrativos de transporte</h3>
      <p>Podem ser armazenadas informações como ônibus cadastrados, incluindo placa, marca, capacidade e status, bem como dados sobre rotas, origem, destino, horários, ocorrências e solicitações de ônibus extra.</p>

      <h2>3. Finalidades do tratamento</h2>
      <p>Os dados pessoais são utilizados para cadastrar e autenticar usuários, validar o vínculo institucional e permitir a consulta de ônibus, rotas, horários, vagas e status das viagens. Também são empregados para registrar reservas e cancelamentos, controlar listas de espera, aplicar regras de prioridade e verificar o quórum necessário para a realização das viagens. Além disso, esses dados possibilitam a confirmação de presença por meio de check-in, o registro de ausências e eventuais penalidades, bem como o gerenciamento de convidados. Servem ainda para viabilizar a administração de ônibus, rotas, horários e viagens, o registro de ocorrências, a garantia da segurança e do controle de acesso ao sistema e a realização de auditorias administrativas relacionadas ao uso do transporte.</p>
      <p>Os dados não são utilizados para publicidade, venda de informações, perfilamento comercial ou análise comportamental externa.</p>

      <h2>4. Ausência de telemetria e rastreamento</h2>
      <p>O EasyRota não utiliza telemetria de comportamento do usuário.</p>
      <p>Isso significa que o sistema não coleta dados relacionados ao comportamento do usuário, como tempo de permanência em páginas para fins analíticos, mapas de clique, rastreamento de navegação fora do sistema, identificadores de publicidade, uso de ferramentas externas de analytics ou qualquer forma de coleta automatizada voltada para marketing.</p>
      <p>Registros técnicos estritamente necessários para segurança, autenticação, funcionamento do sistema ou correção de erros poderão existir, desde que limitados à finalidade operacional.</p>

      <h2>5. Compartilhamento de dados</h2>
      <p>O EasyRota não compartilha dados pessoais com terceiros para fins comerciais, publicitários, estatísticos ou de telemetria.</p>
      <p>O acesso aos dados deve ser restrito aos perfis autorizados, conforme a necessidade de operação do sistema.</p>
      <p>Poderão acessar dados, dentro dos limites de suas funções:</p>
      <ul>
        <li>administradores autorizados;</li>
        <li>equipe responsável pela gestão do transporte;</li>
        <li>motoristas, apenas quanto às informações necessárias ao check-in e condução da viagem;</li>
        <li>equipe técnica responsável pela manutenção do sistema, quando necessário.</li>
      </ul>
      <p>Caso haja obrigação legal, ordem de autoridade competente ou necessidade institucional formal, dados poderão ser disponibilizados nos limites exigidos pela norma aplicável.</p>

      <h2>6. Base para tratamento dos dados</h2>
      <p>O tratamento dos dados ocorre para viabilizar a prestação e organização do serviço de transporte universitário, controle de acesso, segurança, execução de funcionalidades do sistema e cumprimento de obrigações administrativas.</p>
      <p>Quando necessário, o tratamento também poderá se apoiar no cumprimento de obrigações legais ou regulatórias e no exercício regular de direitos pela instituição responsável.</p>

      <h2>7. Segurança dos dados</h2>
      <p>A equipe responsável deverá adotar medidas técnicas e administrativas para proteger os dados pessoais contra acesso não autorizado, perda, alteração, divulgação indevida ou uso inadequado.</p>
      <p>Entre as medidas recomendadas estão:</p>
      <ul>
        <li>autenticação por senha;</li>
        <li>controle de permissões por perfil;</li>
        <li>restrição de acesso a dados sensíveis;</li>
        <li>armazenamento seguro de senhas;</li>
        <li>proteção contra acesso não autorizado;</li>
        <li>registros administrativos de operações relevantes;</li>
        <li>revisão periódica de permissões.</li>
      </ul>
      <p>O usuário também deve colaborar com a segurança, mantendo sua senha em sigilo e evitando compartilhar sua conta.</p>

      <h2>8. Exibição de dados para outros usuários</h2>
      <p>O sistema deve evitar a exposição de dados sensíveis de outros passageiros.</p>
      <p>Sempre que possível, as telas devem exibir apenas informações necessárias, como quantidade de vagas, status da viagem, posição do usuário, quantidade de passageiros ou confirmação de reserva.</p>
      <p>Dados como CPF, documentos, matrícula, CNH e informações completas de outros usuários não devem ser exibidos publicamente.</p>

      <h2>9. Retenção dos dados</h2>
      <p>Os dados serão mantidos pelo período necessário para cumprir as finalidades do sistema, permitir auditoria administrativa, resolver conflitos, manter histórico de reservas e cumprir obrigações legais ou institucionais.</p>
      <p>Quando os dados deixarem de ser necessários, deverão ser excluídos ou anonimizados, salvo quando houver justificativa administrativa ou legal para manutenção.</p>

      <h2>10. Direitos do usuário</h2>
      <p>Nos termos da legislação aplicável, o usuário poderá solicitar:</p>
      <ul>
        <li>confirmação da existência de tratamento de seus dados;</li>
        <li>acesso aos dados pessoais;</li>
        <li>correção de dados incompletos, inexatos ou desatualizados;</li>
        <li>informações sobre o uso dos dados;</li>
        <li>eliminação ou anonimização de dados desnecessários, excessivos ou tratados de forma inadequada, quando aplicável;</li>
        <li>revisão de informações administrativas relacionadas ao uso do sistema, quando cabível.</li>
      </ul>
      <p>As solicitações devem ser feitas pelo canal de contato indicado nesta política.</p>
      <p>Alguns dados poderão precisar ser mantidos mesmo após solicitação de exclusão, quando houver obrigação legal, necessidade administrativa, segurança, auditoria ou exercício regular de direitos.</p>

      <h2>11. Responsabilidades do usuário</h2>
      <p>O usuário é responsável por:</p>
      <ul>
        <li>fornecer informações verdadeiras;</li>
        <li>manter seus dados atualizados;</li>
        <li>proteger sua senha;</li>
        <li>não compartilhar sua conta;</li>
        <li>não cadastrar convidados com dados falsos;</li>
        <li>cancelar reservas que não pretende utilizar;</li>
        <li>utilizar o sistema apenas para as finalidades previstas.</li>
      </ul>

      <h2>12. Dados de menores de idade</h2>
      <p>Caso o sistema seja utilizado por usuários menores de idade, o tratamento dos dados deverá observar as regras institucionais e legais aplicáveis.</p>
      <p>A instituição responsável deverá definir os procedimentos adequados para validação, autorização e proteção reforçada quando necessário.</p>

      <h2>13. Incidentes de segurança</h2>
      <p>Caso ocorra incidente que possa comprometer dados pessoais, a equipe responsável deverá avaliar o ocorrido, adotar medidas de contenção e, quando aplicável, comunicar os titulares afetados e a autoridade competente.</p>

      <h2>14. Alterações nesta política</h2>
      <p>Esta Política de Privacidade poderá ser atualizada para refletir mudanças no sistema, nas regras de funcionamento, nos dados coletados ou em exigências legais.</p>
      <p>A versão atualizada deverá indicar a data da última modificação.</p>

      <h2>15. Contato</h2>
      <p>Para dúvidas, solicitações ou exercício de direitos relacionados a dados pessoais, o usuário poderá entrar em contato por:</p>
      <p>
        <strong>Contato:</strong> {contactLinks}
      </p>
      <p>
        <strong>Responsável:</strong> EasyRota / UNINFRA
      </p>
    </LegalShell>
  )
}
