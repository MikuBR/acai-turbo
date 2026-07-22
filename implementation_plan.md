# Implementation Plan

[Overview]
Remover todas as classes de cores hardcoded do Tailwind (bg-gray-*, text-gray-*, border-gray-*) dos componentes e substituí-las pelas variáveis CSS customizadas do tema claro (bg-surface, text-primary, border-border, etc.), garantindo que toda a aplicação use consistentemente o tema claro.

[Types]
Não há alterações no sistema de tipos. O tema já está configurado com variáveis CSS em src/styles/theme.css e o ThemeContext já está simplificado para fornecer apenas o tema claro.

[Files]
Serão modificados múltiplos arquivos de componentes para substituir classes hardcoded:

- src/components/atoms/Button.jsx - Substituir cores gray-* por variáveis do tema
- src/components/atoms/Badge.jsx - Substituir cores gray-* por variáveis do tema  
- src/components/atoms/Input.jsx - Substituir cores gray-* por variáveis do tema
- src/components/atoms/Select.jsx - Substituir cores gray-* por variáveis do tema
- src/components/atoms/ProductCard.jsx - Substituir cores gray-* por variáveis do tema
- src/components/molecules/ModalHeader.jsx - Substituir cores gray-* por variáveis do tema
- src/components/molecules/ModalFooter.jsx - Substituir cores gray-* por variáveis do tema
- src/components/molecules/SettingsTabs.jsx - Substituir cores gray-* por variáveis do tema
- src/components/molecules/SettingsTab.jsx - Substituir cores gray-* por variáveis do tema
- src/components/organisms/Sidebar.jsx - Substituir cores gray-* por variáveis do tema
- src/components/organisms/OrderSidebar.jsx - Substituir cores gray-* por variáveis do tema
- src/components/organisms/CartPanel.jsx - Substituir cores gray-* por variáveis do tema
- src/components/organisms/CatalogPanel.jsx - Substituir cores gray-* por variáveis do tema
- src/components/organisms/LoginModal.jsx - Substituir bg-gray-900/98 por bg-surface
- src/components/organisms/PasswordModal.jsx - Substituir bg-gray-900/98 por bg-surface
- src/components/organisms/ManagerAuthModal.jsx - Substituir bg-gray-900/98 por bg-surface
- src/components/organisms/AcaiBuilderModal.jsx - Substituir cores gray-* por variáveis do tema
- src/components/organisms/QuickBuilderModal.jsx - Substituir cores gray-* por variáveis do tema
- src/components/organisms/CheckoutModal.jsx - Substituir cores gray-* por variáveis do tema
- src/components/organisms/NewTableModal.jsx - Substituir cores gray-* por variáveis do tema
- src/components/organisms/SettingsModal.jsx - Substituir cores gray-* por variáveis do tema
- src/components/organisms/ReportsModal.jsx - Substituir cores gray-* por variáveis do tema
- src/components/forms/UserForm.jsx - Substituir text-gray-600 por text-muted
- src/components/forms/ProductForm.jsx - Substituir text-gray-600 por text-muted
- src/components/forms/ClientForm.jsx - Substituir text-gray-600 por text-muted
- src/components/forms/InventoryForm.jsx - Substituir text-gray-600 por text-muted
- src/components/forms/CategoryForm.jsx - Substituir bg-gray-* por bg-surface-light
- src/components/forms/PromotionForm.jsx - Substituir text-gray-600 por text-muted
- src/components/forms/FinancialForm.jsx - Substituir text-gray-600 por text-muted
- src/components/ErrorBoundary.jsx - Substituir bg-gray-* por variáveis do tema
- src/App.jsx - Substituir cores gray-* por variáveis do tema

[Functions]
Não há alterações em funções. Apenas modificação de strings className nos JSX.

[Classes]
Não há alterações em classes. Apenas modificação de className nos elementos JSX.

[Dependencies]
Não há alterações em dependências. Apenas modificação de classes CSS nos componentes existentes.

[Testing]
Após as modificações:
1. Executar a aplicação com `npm run dev`
2. Verificar que todas as telas (login, sidebar, catálogo, carrinho, modais) estão com tema claro
3. Verificar que não há mais cores escuras predominantes
4. Verificar contraste e legibilidade dos textos

[Implementation Order]
1. Modificar arquivos de átomos (Button, Badge, Input, Select, ProductCard)
2. Modificar arquivos de moléculas (ModalHeader, ModalFooter, SettingsTabs, SettingsTab)
3. Modificar arquivos de organismos (Sidebar, OrderSidebar, CartPanel, CatalogPanel, modais)
4. Modificar arquivos de forms (UserForm, ProductForm, ClientForm, etc.)
5. Modificar App.jsx e ErrorBoundary.jsx
6. Executar aplicação e verificar visualmente
7. Commitar alterações