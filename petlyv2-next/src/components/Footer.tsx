import { PawPrint, Mail, Phone, ShieldCheck, MessageCircle, Globe, Share2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <PawPrint className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                PetCare Connect
              </span>
            </div>
            <p className="text-gray-600 max-w-md mb-8">
              A maior rede de cuidadores de pets do Brasil. Cuidamos com amor e responsabilidade para que você possa viajar com tranquilidade.
            </p>
            <div className="flex gap-4">
              <button className="p-3 bg-white shadow-sm hover:shadow-md rounded-full text-indigo-600 hover:text-white hover:bg-indigo-600 transition-all">
                <MessageCircle className="w-5 h-5" />
              </button>
              <button className="p-3 bg-white shadow-sm hover:shadow-md rounded-full text-indigo-600 hover:text-white hover:bg-indigo-600 transition-all">
                <Globe className="w-5 h-5" />
              </button>
              <button className="p-3 bg-white shadow-sm hover:shadow-md rounded-full text-indigo-600 hover:text-white hover:bg-indigo-600 transition-all">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-6">Explore</h4>
            <ul className="space-y-4 text-gray-600 text-sm">
              <li className="hover:text-indigo-600 cursor-pointer transition-colors">Como funciona</li>
              <li className="hover:text-indigo-600 cursor-pointer transition-colors">Seguro Veterinário</li>
              <li className="hover:text-indigo-600 cursor-pointer transition-colors">Blog</li>
              <li className="hover:text-indigo-600 cursor-pointer transition-colors">Carreiras</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-6">Suporte</h4>
            <ul className="space-y-4 text-gray-600 text-sm">
              <li className="hover:text-indigo-600 cursor-pointer transition-colors flex items-center gap-2">
                <Mail className="w-4 h-4" /> contato@petcare.com.br
              </li>
              <li className="hover:text-indigo-600 cursor-pointer transition-colors flex items-center gap-2">
                <Phone className="w-4 h-4" /> (11) 99999-9999
              </li>
              <li className="hover:text-indigo-600 cursor-pointer transition-colors flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Central de Segurança
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-sm">
            © 2026 PetCare Connect Ltda. Todos os direitos reservados.
          </p>
          <div className="flex gap-8 text-sm text-gray-500">
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Termos de Uso</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Privacidade</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
